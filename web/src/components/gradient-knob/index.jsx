import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import styles from './styles.module.css';

/**
 * @typedef {Object} GradientKnobProps
 * @property {number} [offset] The offset of the color in the gradient.
 * @property {number} stopIdx The index of the gradient stop that this knob reprisents
 * @property {() => void} [onDelete] An event handler that is executed when the knob is pressed.
 * @property {() => void} [onPointerDown] An event handler that is executed when the knob is pressed.
 */

/**
 * A component for choosing a color for a gradient
 * @param {GradientKnobProps & React.HTMLProps<HTMLInputElement>} props
 */
export function GradientKnob({value, offset, stopIdx, onPointerDown, onDelete, ...rest}) {
	return <div className={styles['gradient-knob']} style={{ left: (offset * 100) + '%' }}>
		<label
			className={styles['gradient-knob-grip']}
			onPointerDown={onPointerDown}
			data-stop-idx={stopIdx} >
			<svg className={styles['gradient-knob-svg']} height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8.4666665 8.4666666">
				<path
					className={styles['gradient-color-geom']}
					fill={value}
					d="M 4.2333333,0.32814534 2.4928711,2.2288045 C 2.2852849,2.421787 2.1559407,2.6973689 2.1559407,3.0044677 v 4.0633178 c 0,0.5863161 0.4720173,1.0583334 1.0583333,1.0583334 h 2.0381185 c 0.5863161,0 1.0583333,-0.4720173 1.0583333,-1.0583334 V 3.0044677 c 0,-0.3070988 -0.1293441,-0.5826807 -0.3369303,-0.7756632 z"/>
			</svg>
			<input className={styles['gradient-color-input']} type="color" value={value} {...rest} />
		</label>
		<button className={styles['gradient-knob-delete']} onClick={onDelete}><FontAwesomeIcon icon={faTrash} /></button>
	</div>
}