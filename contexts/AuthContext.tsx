"use client";

import React, {useState, useEffect, useContext, createContext} from "react";
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as authSignOut,
  UserCredential,
  signInAnonymously as authSignInAnonymously,
  TwitterAuthProvider,
  GithubAuthProvider,
  linkWithCredential,
  OAuthProvider
} from "firebase/auth";
import Swal from "sweetalert2";
import {getAnalytics, logEvent} from "firebase/analytics";
import * as Sentry from "@sentry/nextjs";

import {GameUser} from "interfaces";
import {addUser, getUser, getUserByEmail, updateUser} from "services/user";
import useUserInfo from "hooks/useUserInfo";

export type AuthProviders = keyof typeof AUTH_PROVIDERS;

interface AuthContextState {
  user: User | null;
  gameUser?: GameUser;
  loading: boolean;
  signInWithProvider: (provider?: AuthProviders) => void;
  signInAnonymously: VoidFunction;
  signOut: VoidFunction;
  createUsername: (username: string, isAnonymously: boolean) => void;
  updateGameUser: (props: Partial<GameUser>) => void;
}

const githubProvider = new GithubAuthProvider();
githubProvider.setCustomParameters({
  redirect_uri: "localhost:4000"
});

const AUTH_PROVIDERS = {
  google: GoogleAuthProvider,
  twitter: TwitterAuthProvider,
  github: GithubAuthProvider
};

const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithProvider: () => ({}),
  signInAnonymously: () => ({}),
  signOut: () => ({}),
  createUsername: () => ({}),
  updateGameUser: () => ({})
} as AuthContextState);

interface Props {
  children: JSX.Element;
}

export function AuthProvider({children}: Props) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [gameUser, setGameUser] = useState<GameUser>();
  const [loading, setLoading] = useState(true);
  const userInfo = useUserInfo();
  const auth = getAuth();

  const updateGameUser = (gameUserProps: Partial<GameUser>) => {
    setGameUser((prev) => prev && {...prev, ...gameUserProps});
  };

  const updateUserName = async (name: string) => {
    const key = sessionStorage.getItem("userKey");
    const objUser: GameUser = JSON.parse(sessionStorage.getItem("objUser")!);
    if (objUser) {
      setGameUser({...objUser, username: name});
    } else if (key !== null) {
      const dbUser = await getUser(key);
      if (dbUser) {
        const obj = {
          username: dbUser.username,
          maxScores: dbUser.maxScores,
          email: dbUser.email
        };
        setGameUser(obj);
        sessionStorage.setItem("objUser", JSON.stringify(obj));
      }
    } else {
      setGameUser({
        username: name
      });
    }
  };

  const handleUser = async (gUser: User | null) => {
    if (gUser) {
      setUser(gUser);

      const username = localStorage.getItem("user");
      if (gUser.isAnonymous) {
        // User is anonymous

        if (gUser.uid && username) {
          localStorage.setItem("uid", gUser.uid);
          setGameUser({username: username});
        }
      } else {
        // User is logged with a provider
        const key = sessionStorage.getItem("userKey");
        const objUser = JSON.parse(sessionStorage.getItem("objUser")!);

        if (objUser) {
          if (!username) {
            localStorage.setItem("user", objUser.username);
          }

          setGameUser(objUser);
          Sentry.setContext("user", objUser);
          if (key) {
            await getUser(key).then((dbUser) => {
              if (dbUser !== objUser) {
                setGameUser(dbUser);
                Sentry.setContext("user", dbUser);
                sessionStorage.setItem("objUser", JSON.stringify(dbUser));
              }
            });
          }
        } else if (key) {
          updateUserName("");
        } else {
          setLoading(true);
          if (gUser.email) {
            const findedUser = await getUserByEmail(gUser.email);

            if (findedUser && findedUser.key) {
              const obj = {
                username: findedUser.username,
                maxScores: findedUser.maxScores,
                email: findedUser.email
              };

              localStorage.setItem("user", findedUser.username);
              sessionStorage.setItem("userKey", findedUser.key);
              setGameUser(obj);
              sessionStorage.setItem("objUser", JSON.stringify(obj));
            }
          } else {
            auth.signOut();
          }
        }
      }
      setLoading(false);
      return gUser;
    } else {
      setLoading(false);
      setUser(null);
      setGameUser(undefined);
      return false;
    }
  };

  const signInWithProvider = async (provider: AuthProviders = "google") => {
    const response = await signInWithPopup(
      auth,
      new AUTH_PROVIDERS[provider]()
    ).catch((error) => {
      if (error.code === "auth/account-exists-with-different-credential") {
        const pendingCred = AUTH_PROVIDERS[provider].credentialFromError(error);
        if (pendingCred) {
          sessionStorage.setItem(
            "pending-credential",
            JSON.stringify(pendingCred)
          );

          Swal.fire({
            heightAuto: false,
            title: "Existing email",
            text: `Please sign in with the previous method to vinculate accounts`
          });
        }
      }

      if (
        error.code !== "auth/cancelled-popup-request" &&
        error.code !== "auth/popup-closed-by-user"
      ) {
        console.error(error);
        throw error;
      }
    });

    if (response) {
      const pendingCred = sessionStorage.getItem("pending-credential");

      if (pendingCred !== null) {
        let parsedCredential = JSON.parse(pendingCred);

        if (parsedCredential.providerId === "twitter.com") {
          parsedCredential = TwitterAuthProvider.credential(
            parsedCredential.accessToken,
            parsedCredential.secret
          );
        } else {
          parsedCredential = OAuthProvider.credentialFromJSON(parsedCredential);
        }

        if (
          !response.user.providerData.some(
            (provider) => provider.providerId === parsedCredential.providerId
          )
        ) {
          console.log(response.user, parsedCredential);
          await linkWithCredential(response.user, parsedCredential);
          sessionStorage.removeItem("pending-credential");
        }
      }

      handleLoginWithProvider(response);
    }
  };

  //Function for login a guest user
  const signInAnonymously = () => {
    authSignInAnonymously(auth).catch((e) => console.error(e));
  };

  const signOut = async () => {
    await authSignOut(auth);
    handleUser(null);
  };

  const createUsername = async (username: string, isAnonymously: boolean) => {
    const key = sessionStorage.getItem("userKey");
    if (key) {
      await updateUser(key, {username});
    }

    if (isAnonymously) {
      setGameUser({username});
    }

    logEvent(getAnalytics(), "login", {
      action: "login",
      isAnonymously,
      username,
      ...userInfo
    });
    setGameUser((prev) => prev && {...prev, username});
    localStorage.setItem("user", username);
  };

  //Function for login a Auth Provider account user
  const handleLoginWithProvider = (data: UserCredential) => {
    //Check if user is new
    const userEmail = data.user.email;
    let userNew = true;

    if (userEmail) {
      getUserByEmail(userEmail)
        .then(async (existingUser) => {
          if (existingUser && existingUser.key) {
            userNew = false;

            localStorage.setItem("user", existingUser.username);
            sessionStorage.setItem("userKey", existingUser.key);
            setGameUser(existingUser);
            logEvent(getAnalytics(), "login", {
              action: "login",
              isAnonymously: false,
              username: existingUser.username,
              ...userInfo
            });
          }

          if (userNew && userEmail) {
            const newKeyUser = await addUser({
              email: userEmail,
              maxScores: [],
              username: ""
            });

            if (newKeyUser) {
              sessionStorage.setItem("userKey", newKeyUser);
            } else {
              console.error("Error generating new user");
            }
          }
        })
        .finally(() => {
          handleUser(data.user);
        });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);

    return () => unsubscribe();
  }, []);

  return {
    user,
    gameUser,
    loading,
    signInWithProvider,
    signInAnonymously,
    signOut,
    createUsername,
    updateGameUser
  };
}
