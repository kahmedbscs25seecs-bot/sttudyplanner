import { DIFFICULTY_STEPS, difficultyLabel } from './difficulty';

interface DifficultyMeterProps {
  value: number;
}

/**
 * Read-only difficulty reading: five discrete segments filled to `value`.
 * Deliberately not stars — stars read as a quality rating, and this is a
 * calibrated scale. Monochrome on purpose: the count carries the information,
 * so a color ramp would just add noise.
 *
 * Shares its segment shape with DifficultyPicker so the value you choose in
 * the form is the value you recognize on the card.
 */
export function DifficultyMeter({ value }: DifficultyMeterProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-[3px]" aria-hidden="true">
        {DIFFICULTY_STEPS.map((step) => (
          <span
            key={step}
            className={`h-3 w-1.5 rounded-[1px] ${
              step <= value ? 'bg-accent' : 'bg-line'
            }`}
          />
        ))}
      </span>
      <span className="text-xs text-muted">{difficultyLabel(value)}</span>
    </span>
  );
}
