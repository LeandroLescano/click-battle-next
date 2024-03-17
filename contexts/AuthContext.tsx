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
import {get, getDatabase, push, ref, update} from "firebase/database";
import {getAnalytics, logEvent} from "firebase/analytics";

import {GameUser} from "interfaces";
import {getUser} from "services/user";
import useUserInfo from "hooks/useUserInfo";

export type AuthProviders = keyof typeof AUTH_PROVIDERS;

interface AuthContextState {
  user: User | null;
  gameUser?: GameUser;
  loading: boolean;
  signInWithProvider: (provider?: AuthProviders) => void;
  signInAnonymously: (username: string) => void;
  signOut: VoidFunction;
  createUser: (username: string) => void;
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
  createUser: () => ({}),
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
  const db = getDatabase();

  const updateGameUser = (gameUserProps: Partial<GameUser>) => {
    setGameUser((prev) => prev && {...prev, ...gameUserProps});
  };

  const updateUserName = (name: string) => {
    const key = sessionStorage.getItem("userKey");
    const objUser: GameUser = JSON.parse(sessionStorage.getItem("objUser")!);
    if (objUser) {
      setGameUser({...objUser, username: name});
    } else if (key !== null) {
      const refUsers = ref(db, `users/${key}`);
      get(refUsers).then((snapshot) => {
        const dbUser = snapshot.val() as GameUser;
        if (dbUser) {
          const obj = {
            username: dbUser.username,
            maxScores: dbUser.maxScores,
            email: dbUser.email
          };
          setGameUser(obj);
          sessionStorage.setItem("objUser", JSON.stringify(obj));
        }
      });
    } else {
      setGameUser({
        username: name
      });
    }
  };

  const handleUser = async (gUser: User | null) => {
    if (gUser) {
      setUser(gUser);

      if (gUser.isAnonymous) {
        const username = localStorage.getItem("user");

        if (gUser.uid && username) {
          localStorage.setItem("uid", gUser.uid);
          setGameUser({username: username});
        }
      } else {
        const key = sessionStorage.getItem("userKey");
        const objUser = JSON.parse(sessionStorage.getItem("objUser")!);

        if (objUser) {
          if (!localStorage.getItem("user")) {
            localStorage.setItem("user", objUser.username);
          }

          setGameUser(objUser);
          if (key) {
            await getUser(key).then((dbUser) => {
              if (dbUser !== objUser) {
                setGameUser(dbUser);
                sessionStorage.setItem("objUser", JSON.stringify(dbUser));
              }
            });
          }
        } else if (key) {
          updateUserName("");
        } else {
          let finded = false;
          const refUsers = ref(db, "users");
          setLoading(true);
          await get(refUsers).then((snapshot) => {
            if (snapshot.val() !== null) {
              const usersDB: User = snapshot.val();

              Object.entries(usersDB).forEach((value) => {
                if (value[1].email && value[1].email === gUser.email) {
                  finded = true;

                  const obj = {
                    username: value[1].username,
                    maxScores: value[1].maxScores,
                    email: value[1].email
                  };

                  localStorage.setItem("user", value[1].username);
                  sessionStorage.setItem("userKey", value[0]);
                  setGameUser(obj);
                  sessionStorage.setItem("objUser", JSON.stringify(obj));
                }
              });
            }
            if (!finded) {
              auth.signOut();
            }
          });
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
  const signInAnonymously = (username: string) => {
    localStorage.setItem("user", username);
    authSignInAnonymously(auth)
      .then(() => {
        logEvent(getAnalytics(), "login", {
          action: "login",
          isAnonymously: true,
          username,
          ...userInfo
        });
        setGameUser({username});
      })
      .catch((e) => console.error(e));
  };

  const signOut = async () => {
    await authSignOut(auth);
    handleUser(null);
  };

  const createUser = (username: string) => {
    const key = sessionStorage.getItem("userKey");
    const refUser = ref(db, `users/${key}`);

    update(refUser, {username});
    logEvent(getAnalytics(), "login", {
      action: "login",
      isAnonymously: false,
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
    const refUsers = ref(db, "users");
    get(refUsers)
      .then((snapshot) => {
        const usersDB: GameUser = snapshot.val() || [];
        Object.entries(usersDB).forEach((value) => {
          if (value[1].email && value[1].email === userEmail) {
            userNew = false;
            localStorage.setItem("user", value[1].username);
            sessionStorage.setItem("userKey", value[0]);
            setGameUser({
              username: value[1].username,
              maxScores: value[1].maxScores,
              email: value[1].email
            });
            logEvent(getAnalytics(), "login", {
              action: "login",
              isAnonymously: false,
              username: value[1].username,
              ...userInfo
            });
            return;
          }
        });
        if (userNew) {
          const refUsers = ref(db, "users");
          const newKeyUser = push(refUsers, {
            email: userEmail,
            maxScores: [],
            username: ""
          }).key;
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
    createUser,
    updateGameUser
  };
}
