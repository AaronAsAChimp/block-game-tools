import { useStore } from '@nanostores/react';
import { paletteStore } from '../../context/palette-store';
import styles from './styles.module.css';


export function PaletteSelector() {
	const palette = useStore(paletteStore);

	return <div className={styles['form-controls']}>
		<label>
			Color Extraction:
			<select onInput={(e) => paletteStore.set(e.target.value)} value={palette}>
				<option value="average">Average</option>
				<option value="mostSaturated">Most Saturated</option>
				<option value="mostCommon">Most Common</option>
			</select>
		</label>
	</div>
}