import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatCard from '../StatCard';
import { describe, it, expect, beforeEach } from 'vitest';

describe('StatCard', () => {
    beforeEach(() => {
        // Set window width to 800 (lg)
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
        window.dispatchEvent(new Event('resize'));
    });

    it('renders title and value', () => {
        render(
            <MemoryRouter>
                <StatCard title="Total Sales" value="5000" meta="Last 30 days" />
            </MemoryRouter>
        );

        // Note: 5000 does not format on 'lg' screens (threshold is 10k)
        expect(screen.getByText('5000')).toBeInTheDocument();
        expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });

    it('formats large values correctly', () => {
        render(
            <MemoryRouter>
                <StatCard value="1500000" />
            </MemoryRouter>
        );
        // 1.5M is formatted because it is > 10,000
        expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    it('renders percentage correctly', () => {
        render(
            <MemoryRouter>
                <StatCard value="100" percentage={12.5} />
            </MemoryRouter>
        );
        expect(screen.getByText('+12.5%')).toBeInTheDocument();
    });
});
