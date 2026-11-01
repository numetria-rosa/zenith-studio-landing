import { Icon } from "../../Icon";
import c from "./chaser.module.css";

/* Text reminders are an optional add-on that needs US carrier approval first (usually 1 to 3 weeks), so this
   says so up front, shows where a request stands, and lets the firm cancel it before it goes live. Email stays
   the way the Document Chaser chases. */
export function TextReminders({
  requestedAt,
  businessName,
  price,
  request,
  cancel,
}: {
  requestedAt: Date | null;
  businessName: string;
  price: number;
  request: () => Promise<void>;
  cancel: () => Promise<void>;
}) {
  const requested = requestedAt !== null;
  const date = requestedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <section className={`${c.sms} ${c.smsCard}`} aria-labelledby="sms-title">
      <div className={c.smsMain}>
        <div className={c.smsHead}>
          <span className={c.smsTile}>
            <Icon name="message" size={26} />
          </span>
          <div className={c.smsTitle}>
            <p className={c.smsEyebrow}>
              Optional add-on
              {requested && (
                <span className={c.smsPill}>
                  <i />
                  Waiting for carriers
                </span>
              )}
            </p>
            <h2 id="sms-title">Text message reminders</h2>
            <p className={c.smsLede}>Email reminders already work. Add texts to reach the clients who never open their inbox. Every reminder goes out by both.</p>
          </div>
          <div className={c.smsPrice}>
            <b>
              ${price}
              <span> / month</span>
            </b>
            <small>Billed only once live</small>
          </div>
        </div>

        <p className={c.smsEyebrow} style={{ marginTop: 26 }}>
          Good to know first
        </p>
        <div className={c.smsFacts}>
          <div className={c.smsFact}>
            <span className={`${c.smsFi} ${c.smsFiAmber}`}>
              <Icon name="clock" size={18} />
            </span>
            <b>1 to 3 weeks to approve</b>
            <p>US phone carriers must approve your firm for business texting. Sometimes it takes longer.</p>
          </div>
          <div className={c.smsFact}>
            <span className={`${c.smsFi} ${c.smsFiViolet}`}>
              <Icon name="dollar" size={18} />
            </span>
            <b>Nothing to pay until then</b>
            <p>The ${price} a month starts the day texting goes live, not when you request it.</p>
          </div>
          <div className={c.smsFact}>
            <span className={`${c.smsFi} ${c.smsFiGreen}`}>
              <Icon name="shieldCheck" size={18} />
            </span>
            <b>Clients opt in first</b>
            <p>They only get texts after agreeing to receive them, and can reply STOP anytime.</p>
          </div>
        </div>

        <div className={c.smsFoot}>
          {requested ? (
            <>
              <ol className={c.smsSteps}>
                <li className={c.smsDone}>
                  <span>
                    <Icon name="check" size={16} strokeWidth={2.6} />
                  </span>
                  <div>
                    <b>Requested</b>
                    <small>{date}</small>
                  </div>
                </li>
                <li className={c.smsNow}>
                  <span>
                    <i />
                  </span>
                  <div>
                    <b>Carrier review</b>
                    <small>Usually 1 to 3 weeks</small>
                  </div>
                </li>
                <li>
                  <span />
                  <div>
                    <b>Texting live</b>
                    <small>${price}/mo starts here</small>
                  </div>
                </li>
              </ol>
              <div className={c.smsRow}>
                <p>
                  <Icon name="mail" size={18} />
                  We&apos;ll email you the day it&apos;s approved. Reminders keep going by email meanwhile.
                </p>
                <form action={cancel}>
                  <button type="submit" className={c.smsGhost}>
                    Cancel request
                  </button>
                </form>
              </div>
            </>
          ) : (
            <form action={request} className={c.smsRow}>
              <button type="submit" className={c.smsGo}>
                Request text reminders <Icon name="arrowRight" size={18} />
              </button>
              <p>Free to request. You can cancel before it goes live.</p>
            </form>
          )}
        </div>
      </div>

      <aside className={c.smsPreview} aria-label="What clients get">
        <p className={c.smsEyebrow}>What clients get</p>
        <p className={c.smsStamp}>Text message · Today 9:41</p>
        <div className={c.smsIn}>
          {businessName}: Hi Jane, we still need 3 documents for your tax return. Upload them here: <u>[link]</u>
          <br />
          <span>Reply STOP to opt out.</span>
        </div>
        <div className={c.smsOut}>Sorry! Uploading them tonight</div>
        <small className={c.smsDelivered}>Delivered</small>
        <p className={c.smsNote}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
          Sent with the same schedule as emails.
        </p>
      </aside>
    </section>
  );
}
