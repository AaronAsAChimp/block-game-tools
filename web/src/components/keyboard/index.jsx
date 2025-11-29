import * as Tone from 'tone';
import styles from './styles.module.css';
import { DATA_DIR } from '../../consts';
import { useRef } from 'react';
import { useEffect } from 'react';
import { noteUrlsStore } from '../../context/note-store';
import { useStore } from '@nanostores/react';


const KEYS = [
	{
		'text': 'F♯/G♭',
		'semitone': 0,
		'natural': false
	},
	{
		'text': 'G',
		'semitone': 1,
		'natural': true
	},
	{
		'text': 'G♯/A♭',
		'semitone': 2,
		'natural': false
	},
	{
		'text': 'A',
		'semitone': 3,
		'natural': true
	},
	{
		'text': 'A♯/B♭',
		'semitone': 4,
		'natural': false
	},
	{
		'text': 'B',
		'semitone': 5,
		'natural': true
	},
	{
		'text': 'C',
		'semitone': 6,
		'natural': true
	},
	{
		'text': 'C♯/D♭',
		'semitone': 7,
		'natural': false
	},
	{
		'text': 'D',
		'semitone': 8,
		'natural': true
	},
	{
		'text': 'D♯/E♭',
		'semitone': 9,
		'natural': false
	},
	{
		'text': 'E',
		'semitone': 10,
		'natural': true
	},
	{
		'text': 'F',
		'semitone': 11,
		'natural': true
	},
	{
		'text': 'F♯/G♭',
		'semitone': 12,
		'natural': false
	},
	{
		'text': 'G',
		'semitone': 13,
		'natural': true
	},
	{
		'text': 'G♯/A♭',
		'semitone': 14,
		'natural': false
	},
	{
		'text': 'A',
		'semitone': 15,
		'natural': true
	},
	{
		'text': 'A♯/B♭',
		'semitone': 16,
		'natural': false
	},
	{
		'text': 'B',
		'semitone': 17,
		'natural': true
	},
	{
		'text': 'C',
		'semitone': 18,
		'natural': true
	},
	{
		'text': 'C♯/D♭',
		'semitone': 19,
		'natural': false
	},
	{
		'text': 'D',
		'semitone': 20,
		'natural': true
	},
	{
		'text': 'D♯/E♭',
		'semitone': 21,
		'natural': false
	},
	{
		'text': 'E',
		'semitone': 22,
		'natural': true
	},
	{
		'text': 'F',
		'semitone': 23,
		'natural': true
	},
	{
		'text': 'F♯/G♭',
		'semitone': 24,
		'natural': false
	},
];

/** @typedef {Record<string, Tone.GrainPlayer>} Instruments */


export function Keyboard() {
	/** @type {import('react').MutableRefObject<Instruments>} [description] */
	const noteBaseRef = useRef({});
	const noteUrls = useStore(noteUrlsStore);
	const instrumentId = 'pling';

	async function playTone(semitone) {
		await Tone.start();

		// noteBaseRef.current.bass;

		console.log('Note base ref', noteBaseRef.current[instrumentId].toDestination());

		const instrument = noteBaseRef.current[instrumentId];

		console.log('state', instrument.state);
		console.log('loaded', instrument.loaded);
		// const pitchShift = new Tone.GrainPlayer().toDestination();
		instrument.detune = semitone * 100;
		instrument.start(undefined, 0);

		// player.autostart = true;

		Tone.getTransport().scheduleOnce(() => {
			instrument.stop();
		}, '+0.5');

		console.log(instrument.state);
	}

	useEffect(() => {
		// Preload the noteblock sounds
		console.log(noteUrls);

		for (const key in noteUrls) {
			noteBaseRef.current[key] = new Tone.GrainPlayer(noteUrls[key]);
		}

		return () => {
			console.log(noteBaseRef.current);
			for (const key in noteBaseRef.current) {
				if (noteBaseRef.current[key]) {
					noteBaseRef.current[key].dispose();
				}
			}
		}
	}, [noteUrls]);

	return <div>
		{ KEYS.map((key) => {
			return <button
				onClick={() => playTone(key.semitone)}
				className={key.natural ? styles['white-key'] : styles['black-key']}>
				{ key.text }
			</button>
		})}
	</div>
}
