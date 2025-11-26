import { Badge as MantineBadge, type BadgeProps } from '@mantine/core';
import { twJoin } from 'tailwind-merge';
import { BADGE_COLORS } from '../utils/badge-colors';

export function Badge({ children, ...props }: BadgeProps) {
	const color = BADGE_COLORS[props.color as keyof typeof BADGE_COLORS];

	return (
		<MantineBadge
			{...props}
			style={{
				background: color?.background,
				border: `1px solid ${color?.border}`,
				color: color?.text,
				...props.style,
			}}
			className={twJoin(
				'rounded-md px-2',
				'text-[12px] font-[400]',
				'transition-colors duration-200',
				props.className
			)}
		>
			{children}
		</MantineBadge>
	);
}



