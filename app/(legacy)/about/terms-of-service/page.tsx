import React from "react";
import {Container} from "react-bootstrap";

const TermsOfService = () => {
  return (
    <div className="overflow-y-auto h-100 py-4">
      <Container fluid="lg" className="about-container">
        <h1>Terms of Service for Click Battle</h1> Welcome to Click Battle!
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access and use
          of Click Battle (&quot;Game&quot;), a web-based online multiplayer
          click battle game developed by{" "}
          <a href="https://codermount.com" target="_blank" rel="noreferrer">
            CoderMount
          </a>{" "}
          (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or
          using the Game, you agree to be bound by these Terms.
        </p>
        <h4>1. Age Restrictions</h4>
        <p>
          There are no age restrictions to play the Game. However, we recommend
          parental guidance for younger users.
        </p>
        <h4>2. Account Creation</h4>
        <p>
          You can access the Game as a guest user or create an account using
          Google, Twitter, or Github. We utilize Firebase Authentication for
          account creation, and we do not store your passwords.
        </p>
        <h4>3. Acceptable Use</h4>
        <p>
          You agree to use the Game for its intended purpose and in accordance
          with these Terms. Prohibited activities include: Using auto-clickers
          or other tools that automate gameplay. Cheating, hacking, or
          exploiting bugs to gain an unfair advantage. Harassing, bullying, or
          threatening other players. Creating multiple accounts or rooms with
          the intent of disrupting gameplay. Uploading inappropriate or
          offensive content.
        </p>
        <h4>4. Intellectual Property</h4>
        <p>
          Currently, the Game does not contain any intellectual property
          protected by copyright or trademark. However, we reserve all rights to
          the Game itself, including its code, artwork, and design.
        </p>
        <h4>5. Account Termination</h4>
        <p>
          We reserve the right to terminate your account for repeated violations
          of these Terms, cheating, or abusing the Game (e.g., creating
          excessive unused rooms).
        </p>
        <h4>6. Disclaimers</h4>
        <p>
          The Game is provided &quot;as is&quot; without warranty of any kind,
          express or implied. This includes, but is not limited to, warranties
          of merchantability, fitness for a particular purpose, and
          non-infringement. We are not responsible for any data loss or
          technical problems you may experience while playing the Game.
        </p>
        <h4>7. Communication</h4>
        <p>
          Currently, the Game offers no in-game chat or voice communication
          features.
        </p>
        <h4>8. Virtual Goods and Currency</h4>
        <p>
          There are currently no virtual goods or in-game currency available for
          purchase.
        </p>
        <h4>9. User-Generated Content</h4>
        <p>
          Currently, players cannot create or upload any content within the
          Game.
        </p>
        <h4>10. Data Privacy</h4>
        <p>
          We collect user data through Firebase Authentication and Turdo
          database. This data may include usernames, login information provided
          by the chosen authentication service (e.g., email address), and
          gameplay activity. We use this data to operate and improve the Game.
          We recommend you review the privacy policies of Firebase
          Authentication and Turdo database for their data handling practices.
        </p>
        <h4>11. Updates to the Terms</h4>
        <p>
          We may revise these Terms at any time by posting the updated terms on
          the Game website. Your continued use of the Game after the posting of
          any revised Terms constitutes your acceptance of the revised Terms.
        </p>
        <h4>12. Governing Law</h4>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of Argentina without regard to its conflict of law provisions.
        </p>
        <h4>13. Contact Us</h4>
        <p>
          If you have any questions about these Terms, please contact us using
          the form in our home page. By accessing or using the Game, you
          acknowledge that you have read, understood, and agree to be bound by
          these Terms. Note: This is a sample Terms of Service and may not
          address all potential issues. You may want to consult with a lawyer to
          ensure your Terms of Service are comprehensive and legally sound for
          your specific game.
        </p>
      </Container>
    </div>
  );
};

export default TermsOfService;
