import { faReddit, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faMessage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import * as styles from './styles.module.css';


// Loosely based on https://sharingbuttons.io/
export function Share({href, subject, body}) {
	return <div>
		Share

		<a className={styles['share-link']} title="E-Mail" href={`mailto:?subject=${ encodeURIComponent(subject) }&body=${ encodeURIComponent(href) }`} target="_self" rel="noopener" aria-label="Share by E-Mail">
			<FontAwesomeIcon icon={faEnvelope} />
		</a>

		<a className={styles['share-link']} title="Text Message" href={`sms:?&body=${ encodeURIComponent(subject + ' - ' + href) }`}>
			<FontAwesomeIcon icon={faMessage} />
		</a>

		<a className={styles['share-link']} title="Twitter" href={`https://twitter.com/intent/tweet/?text=${ encodeURIComponent(subject) }&url=${ encodeURIComponent(href) }`} target="_blank" rel="noopener" aria-label="Share on Twitter">
			<FontAwesomeIcon icon={faTwitter} />
		</a>

		<a className={styles['share-link']} title="Reddit" href={`https://reddit.com/submit/?url=${ encodeURIComponent(href) }&resubmit=true&title=${ encodeURIComponent(subject) }`} target="_blank" rel="noopener" aria-label="Share on Reddit">
			<FontAwesomeIcon icon={faReddit} />
		</a>
	</div>
}