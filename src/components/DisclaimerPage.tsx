export function DisclaimerPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="disclaimer-page">
      <div className="disclaimer-page-content">
        <button className="disclaimer-back-btn" onClick={onBack}>&larr; Back</button>
        <h1>Disclaimer &amp; Terms of Use</h1>

        <h2>No Financial Advice</h2>
        <p>
          This website and application (the "Site") does not provide financial, investment, tax, legal, or
          accounting advice. The content, calculations, projections, and any other information provided on
          or through the Site are for general informational and demonstration purposes only and should not
          be construed as professional financial advice. Nothing on this Site constitutes a recommendation,
          solicitation, or offer to buy or sell any securities, financial instruments, or other assets, or
          to engage in any particular financial strategy.
        </p>

        <h2>Educational &amp; Demonstration Purpose</h2>
        <p>
          This website and application was created solely as an educational exercise to learn how to use
          Claude, an AI assistant developed by Anthropic, to build and deploy software. The Site is a
          demonstration project and is not intended, designed, or suitable for use as a financial planning
          tool. Any resemblance to a production financial application is incidental to its educational
          purpose.
        </p>

        <h2>No Warranty</h2>
        <p>
          The Site and all content, calculations, and projections are provided "as is" and "as available"
          without any warranties of any kind, whether express, implied, statutory, or otherwise, including
          but not limited to warranties of merchantability, fitness for a particular purpose, accuracy,
          completeness, reliability, or non-infringement. The author makes no warranty that the Site will
          be uninterrupted, timely, secure, error-free, or that any results obtained from the use of the
          Site will be accurate or reliable.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by applicable law, in no event shall the author of this Site be
          liable for any direct, indirect, incidental, special, consequential, punitive, or exemplary
          damages, including but not limited to damages for loss of profits, goodwill, use, data, or
          other intangible losses, arising out of or in connection with your access to, use of, or
          inability to use the Site, regardless of the theory of liability (whether in contract, tort,
          negligence, strict liability, or otherwise) and even if the author has been advised of the
          possibility of such damages.
        </p>

        <h2>Prohibited Use</h2>
        <p>
          By accessing this Site, you acknowledge and agree that you will not use this Site, its content,
          calculations, projections, or any other information provided herein to make any financial, investment,
          retirement, tax, legal, or life decisions of any kind whatsoever. The author does not grant you
          permission to use this Site if you intend to rely on it in any conceivable way to inform, guide,
          or support any financial or life decisions. If you do so, you do so entirely at your own risk and
          the author assumes no responsibility or liability for any consequences.
        </p>

        <h2>Consult a Professional</h2>
        <p>
          You should always consult with a qualified and licensed financial advisor, tax professional,
          or other appropriate professional before making any financial, investment, or retirement decisions.
          Do not rely on this Site as a substitute for professional financial advice.
        </p>

        <h2>No Professional Relationship</h2>
        <p>
          Use of this Site does not create any professional, advisory, fiduciary, or other relationship
          between you and the author. The author is not a financial advisor, certified financial planner,
          investment advisor, tax advisor, or attorney.
        </p>

        <h2>Accuracy of Information</h2>
        <p>
          While the author has made reasonable efforts to ensure the calculations and projections are
          based on generally accepted financial formulas, no representation or warranty is made as to the
          accuracy, completeness, or reliability of any information, calculation, or projection provided
          by the Site. Financial markets, tax laws, inflation rates, and other factors are inherently
          unpredictable and subject to change. Past performance and projections are not indicative of
          future results.
        </p>

        <h2>Governing Law</h2>
        <p>
          This disclaimer shall be governed by and construed in accordance with the laws of the
          jurisdiction in which the author resides, without regard to its conflict of law provisions.
        </p>

        <h2>Changes to This Disclaimer</h2>
        <p>
          The author reserves the right to modify this disclaimer at any time without prior notice.
          Your continued use of the Site following any changes constitutes your acceptance of the
          revised disclaimer.
        </p>

        <p className="disclaimer-page-last-updated">
          Last updated: February 2026
        </p>
      </div>
    </div>
  )
}
