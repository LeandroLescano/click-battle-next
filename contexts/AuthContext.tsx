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
  OAuthProvider,
  connectAuthEmulator,
  updateProfile
} from "firebase/auth";
import Swal from "sweetalert2";
import {
  getAnalytics,
  logEvent,
  isSupported,
  setAnalyticsCollectionEnabled
} from "firebase/analytics";
import * as Sentry from "@sentry/nextjs";
import {getApp, getApps, initializeApp} from "firebase/app";
import {connectDatabaseEmulator, getDatabase} from "firebase/database";
import {
  connectFirestoreEmulator,
  getFirestore,
  Timestamp
} from "firebase/firestore";

import {GameUser, MaxScore} from "interfaces";
import {addUser, getUser, getUserByEmail, updateUser} from "services/user";
import {useUserInfo} from "hooks/userInfo";
import {firebaseConfig} from "resources/config";
import {useTheme} from "contexts/ThemeContext";

export type AuthProviders = keyof typeof AUTH_PROVIDERS;

interface AuthContextState {
  user: User | null;
  gameUser?: GameUser;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithProvider: (provider?: AuthProviders) => void;
  signInAnonymously: () => Promise<void>;
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

const AuthContext = createContext<AuthContextState>({
  user: null,
  loading: true,
  isAuthenticated: false,
  signInWithProvider: () => ({}),
  signInAnonymously: () => Promise.resolve(),
  signOut: () => ({}),
  createUsername: () => ({}),
  updateGameUser: () => ({})
});

interface Props {
  children: JSX.Element;
}

if (process.env.NODE_ENV === "development") {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  try {
    connectAuthEmulator(getAuth(app), "http://localhost:9099", {
      disableWarnings: true
    });
    connectFirestoreEmulator(getFirestore(app), "localhost", 8080);
    connectDatabaseEmulator(getDatabase(app), "localhost", 9000);

    isSupported().then(
      (supported) =>
        supported && setAnalyticsCollectionEnabled(getAnalytics(), false)
    );
  } catch (error) {
    console.log({error});
  }
}

export function AuthProvider({children}: Props) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

function useAuthProvider(): AuthContextState {
  const [user, setUser] = useState<User | null>(null);
  const [gameUser, setGameUser] = useState<GameUser>();
  const [loading, setLoading] = useState(true);
  const userInfo = useUserInfo();
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const {clear} = useTheme();

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
              if (dbUser && dbUser !== objUser) {
                setGameUser(dbUser);
                Sentry.setContext("user", dbUser);
                sessionStorage.setItem("objUser", JSON.stringify(dbUser));

                if (dbUser.key) {
                  const lastSession = Timestamp.now();
                  updateUser(dbUser.key, {lastSession});
                }
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
            signOut();
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
            title: "EXISTING EMAIL",
            text: `Please sign in with the previous method to vinculate accounts`
          });
        }
      } else if (
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
          await linkWithCredential(response.user, parsedCredential);
          sessionStorage.removeItem("pending-credential");
        }
      }

      handleLoginWithProvider(response);
    }
  };

  //Function for login a guest user
  const signInAnonymously = async () => {
    await authSignInAnonymously(auth).catch((e) => console.error(e));
  };

  const signOut = async () => {
    if (user) {
      await authSignOut(auth);
      handleUser(null);
    }
    clear();
    updateGameUser({});
    sessionStorage.removeItem("userKey");
    sessionStorage.removeItem("objUser");
    localStorage.removeItem("user");
    localStorage.removeItem("newStyle");
    localStorage.removeItem("feedbackGiven");
  };

  const createUsername = async (username: string, isAnonymously: boolean) => {
    try {
      const key = sessionStorage.getItem("userKey");
      if (key) {
        await updateUser(key, {username});
      }

      if (isAnonymously) {
        setGameUser({username});
      }
      updateProfile(auth.currentUser!, {displayName: username});

      logEvent(getAnalytics(), "login", {
        action: "login",
        isAnonymously,
        username,
        ...userInfo
      });
      setGameUser((prev) => prev && {...prev, username});
      localStorage.setItem("user", username);
    } catch (error) {
      signOut();
    }
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

            const dataToUpdate: Partial<GameUser> = {
              lastLogin: Timestamp.now()
            };

            if (
              existingUser.providers?.length === 0 ||
              data.user.providerData.some(
                (pd) => !existingUser.providers?.includes(pd.providerId)
              )
            ) {
              dataToUpdate.providers = data.user.providerData.map(
                (provider) => provider.providerId
              );
            }

            if (
              gameUser?.points &&
              existingUser.points &&
              gameUser.points > existingUser.points
            ) {
              dataToUpdate.points = gameUser.points;
            }

            if (gameUser?.maxScores && existingUser.maxScores) {
              dataToUpdate.maxScores = mergeMaxScores(
                existingUser.maxScores,
                gameUser.maxScores
              );
            }

            updateUser(existingUser.key, dataToUpdate);
            setGameUser({...existingUser, ...dataToUpdate});

            logEvent(getAnalytics(), "login", {
              action: "login",
              isAnonymously: false,
              username: existingUser.username,
              ...userInfo
            });
          }

          if (userNew && userEmail) {
            const now = Timestamp.now();
            const newKeyUser = await addUser({
              email: userEmail,
              maxScores: gameUser?.maxScores ?? [],
              username: gameUser?.username ?? "",
              points: gameUser?.points ?? 0,
              created: now,
              updated: now,
              lastLogin: now,
              providers: [data.user.providerData[0].providerId]
            });

            if (newKeyUser) {
              sessionStorage.setItem("userKey", newKeyUser);
              if (gameUser?.username) {
                logEvent(getAnalytics(), "sign_up", {
                  action: "sign_up",
                  playedAsAnonymous:
                    gameUser?.maxScores && gameUser.maxScores.length > 0,
                  username: gameUser.username,
                  ...userInfo
                });
              }
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

  const isAuthenticated: boolean = !!(
    user?.uid &&
    gameUser?.username &&
    !loading
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);

    return () => unsubscribe();
  }, []);

  return {
    user,
    gameUser,
    loading,
    isAuthenticated,
    signInWithProvider,
    signInAnonymously,
    signOut,
    createUsername,
    updateGameUser
  };
}

function mergeMaxScores(
  originalMaxScores?: MaxScore[],
  newMaxScores?: MaxScore[]
): MaxScore[] | undefined {
  if (!originalMaxScores || !newMaxScores || newMaxScores.length === 0) {
    return originalMaxScores;
  }

  const mergedScores: MaxScore[] = [];
  const originalMap = new Map<number, MaxScore>();

  if (originalMaxScores) {
    for (const score of originalMaxScores) {
      const existingScore = originalMap.get(score.time);
      if (!existingScore || score.clicks > existingScore.clicks) {
        originalMap.set(score.time, score);
      }
    }
  }

  for (const score of newMaxScores) {
    const existingScore = originalMap.get(score.time);
    if (!existingScore || score.clicks > existingScore.clicks) {
      originalMap.set(score.time, score);
    }
  }

  for (const value of originalMap.values()) {
    mergedScores.push(value);
  }

  return originalMaxScores?.every((score) =>
    mergedScores.some(
      (merged) => merged.time === score.time && merged.clicks === score.clicks
    )
  )
    ? undefined
    : mergedScores;
}
