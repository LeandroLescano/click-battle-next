import React from "react";

import "../styles.scss";

const PrivacyPolicy = () => {
  return (
    <div className="overflow-y-auto h-full py-4">
      <div className="about-container">
        <h1>Privacy Policy</h1>
        <h4>Effective date:</h4>
        <p>16/03/2024</p>
        <h4>Introduction</h4>
        <p>
          This Privacy Policy describes how Click Battle (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) collects, uses, and discloses your
          information when you use our online multiplayer web game (the
          &quot;Service&quot;).
        </p>
        <h4>Information we collect</h4>
        <h5>Guest Users:</h5>
        <ul>
          <li>Device details (limited to what the browser provides)</li>
          <li>Browser data (limited to what the browser provides)</li>
          <li>Username (chosen by the user)</li>
          <li>
            Session data stored in browser cookies or local storage (may include
            a session ID)
          </li>
        </ul>
        <h5>Registered users (via Firebase Authentication):</h5>
        <ul>
          <li>Email address (if using email/password sign-in)</li>
          <li>Device details (limited to what the browser provides)</li>
          <li>Browser data (limited to what the browser provides)</li>
          <li>Username (chosen by the user)</li>
          <li>Gameplay data (for analytics)</li>
        </ul>
        <h4>Use of information</h4>
        <p>We use the information we collect for the following purposes:</p>
        <ul>
          <li>To operate and improve the Service</li>
          <li>To provide customer support</li>
          <li>To personalize your experience</li>
          <li>To analyze how the Service is used</li>
          <li>To prevent or detect fraud or misuse of the Service</li>
        </ul>
        <h4>Information sharing</h4>
        <p>
          We share your information with Firebase, a service by Google, which
          stores the data in a database. Currently, the database location is
          [Turso] (this may change).
        </p>
        <h4>Data storage</h4>
        <h5>Guest user data:</h5>
        <p>
          We store session data and user-selected usernames in your
          browser&apos;s cookies or local storage. We do not store guest user
          data in a persistent database at this time.
        </p>
        <h5>Registered user data:</h5>
        <p>
          Firebase Authentication securely stores registered user data
          (including email address, if applicable).
        </p>
        <h4>Data retention</h4>
        <p>
          We retain your information for as long as necessary to provide the
          Service and fulfill the purposes described in this Privacy Policy. We
          will also retain and use your information to the extent necessary to
          comply with our legal obligations, resolve disputes, and enforce our
          agreements.
        </p>
        <h4>Your choices</h4>
        <p>
          Currently, you cannot choose what data is collected from you. We
          collect the information described above to provide and improve the
          Service.
        </p>
        <h4>Children&apos;s privacy</h4>
        <p>
          We do not knowingly collect information from children under the age of
          13. If you are a parent or guardian and you believe your child has
          provided us with information, please contact us. If we become aware
          that we have collected information from a child under the age of 13,
          we will take steps to delete that information.
        </p>
        <h4>Security</h4>
        <p>
          We take reasonable security measures to protect your information from
          unauthorized access, disclosure, alteration, or destruction. However,
          no internet transmission or electronic storage is ever completely
          secure.
        </p>
        <h4>Changes to this privacy policy</h4>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new Privacy Policy on the Service.
        </p>
        <h4>Contact us</h4>
        <p>
          If you have any questions about this Privacy Policy, please contact us
          using the form in our home page.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
