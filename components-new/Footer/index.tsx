import React, {useCallback, useState} from "react";
import Link from "next/link";
import {useTranslation} from "react-i18next";

import {useAuth} from "contexts/AuthContext";
import {LoginModal} from "components-new";
import {UsernameModal} from "components-new/UsernameModal";
import {FeedbackModal} from "components-new/FeedbackModal";
import {ContactModal} from "components-new/ContactModal";

export const Footer = () => {
  const [showModal, setShowModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactTitle, setContactTitle] = useState<string>();
  const [contactPlaceholder, setContactPlaceholder] = useState<string>();

  const {user} = useAuth();
  const {t} = useTranslation();

  const handleFeedback = () => {
    setShowFeedbackModal(true);
  };

  const handleOnCloseContactModal = () => {
    setShowContactModal(false);
    setContactTitle(undefined);
    setContactPlaceholder(undefined);
  };

  const toggleModal = useCallback(() => setShowModal((prev) => !prev), []);

  return (
    <>
      <footer className="mt-auto flex flex-col-reverse md:flex-row text-2xl font-semibold text-primary-700 dark:text-primary-100 justify-center md:justify-between w-full items-baseline pb-2">
        <div className="mx-auto md:mx-0 ">
          <a
            href="https://cafecito.app/leanlescano"
            rel="noreferrer"
            target="_blank"
          >
            <img
              srcSet="https://cdn.cafecito.app/imgs/buttons/button_2.png 1x, https://cdn.cafecito.app/imgs/buttons/button_2_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_2_3.75x.png 3.75x"
              src="https://cdn.cafecito.app/imgs/buttons/button_2.png"
              alt="Invitame un café en cafecito.app"
            />
          </a>
        </div>
        {user && !user.isAnonymous ? (
          <div className="flex gap-2 mx-auto md:mx-0 my-2 uppercase">
            <a className="cursor-pointer" onClick={handleFeedback}>
              Feedback
            </a>
            <span> | </span>
            <a
              className="cursor-pointer"
              onClick={() => setShowContactModal(true)}
            >
              {t("Contact")}
            </a>
            <span> | </span>
            <Link href="/new/ranking">{t("Ranking")}</Link>
          </div>
        ) : (
          <div className="flex justify-end self-center gap-2 w-full pb-sm-2 pb-0 uppercase">
            <Link href="/new/ranking">{t("Ranking")}</Link>
            <span> | </span>
            <span onClick={toggleModal} className="cursor-pointer">
              {t("Save my data")}
            </span>
          </div>
        )}
      </footer>
      <LoginModal
        allowAnonymous={false}
        show={showModal}
        onClose={toggleModal}
      />
      <UsernameModal />
      <FeedbackModal
        show={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onRequestContact={({title, text}) => {
          setContactTitle(title);
          setContactPlaceholder(text);
          setShowContactModal(true);
        }}
      />
      <ContactModal
        show={showContactModal}
        onClose={handleOnCloseContactModal}
        title={contactTitle}
        text={contactPlaceholder}
      />
    </>
  );
};
