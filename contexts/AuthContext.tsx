import React from "react";
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as authSignOut,
  UserCredential,
  signInAnonymously as authSignInAnonymously
} from "firebase/auth";
import {useState, useEffect, useContext, createContext} from "react";
import {GameUser} from "interfaces";
import {getUser} from "services/user";
import {get, getDatabase, push, ref, update} from "firebase/database";
import {getAnalytics, logEvent} from "firebase/analytics";
import useUserInfo from "hooks/useUserInfo";

interface AuthContextState {
  user: User | null;
  gameUser?: GameUser;
  loading: boolean;
  signInWithGoogle: VoidFunction;
  signInAnonymously: (username: string) => void;
  signOut: VoidFunction;
  createUser: (username: string) => void;
  updateGameUser: (props: Partial<GameUser>) => void;
}

const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithGoogle: () => ({}),
  signInAnonymously: () => ({}),
  signOut: () => ({}),
  createUser: () => ({}),
  updateGameUser: () => ({})
} as AuthContextState);

interface Props {
  children: JSX.Element;
}

export function AuthProvider({children}: Props) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

function useProvideAuth() {
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
            maxScore: dbUser.maxScore,
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
                    maxScore: value[1].maxScore,
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

  const signInWithGoogle = async () => {
    const response = await signInWithPopup(auth, new GoogleAuthProvider());
    handleLoginGoogle(response);
  };

  //Function for login a guest user
  const signInAnonymously = (username: string) => {
    localStorage.setItem("user", username);
    authSignInAnonymously(auth)
      .then(() => {
        logEvent(getAnalytics(), "login", {
          action: "login",
          params: {
            isAnonymously: true,
            username,
            ...userInfo
          }
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
      params: {
        isAnonymously: false,
        username,
        ...userInfo
      }
    });
    setGameUser((prev) => prev && {...prev, username});
    localStorage.setItem("user", username);
  };

  //Function for login a Google account user
  const handleLoginGoogle = (data: UserCredential) => {
    //Check if user is new
    const userEmail = data.user.email;
    let userNew = true;
    const refUsers = ref(db, "users");
    get(refUsers).then((snapshot) => {
      const usersDB: GameUser = snapshot.val() || [];
      Object.entries(usersDB).forEach((value) => {
        if (value[1].email && value[1].email === userEmail) {
          userNew = false;
          localStorage.setItem("user", value[1].username);
          sessionStorage.setItem("userKey", value[0]);
          setGameUser({
            username: value[1].username,
            maxScore: value[1].maxScore,
            email: value[1].email
          });
          logEvent(getAnalytics(), "login", {
            action: "login",
            params: {
              isAnonymously: false,
              username: value[1].username,
              ...userInfo
            }
          });
          return;
        }
      });
      if (userNew) {
        const refUsers = ref(db, "users");
        const newKeyUser = push(refUsers, {
          email: userEmail,
          maxScore: 0,
          username: ""
        }).key;
        if (newKeyUser) {
          sessionStorage.setItem("userKey", newKeyUser);
        } else {
          console.error("Error generating new user");
        }
      }
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
    signInWithGoogle,
    signInAnonymously,
    signOut,
    createUser,
    updateGameUser
  };
}
