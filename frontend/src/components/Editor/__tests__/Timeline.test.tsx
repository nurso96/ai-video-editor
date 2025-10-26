import { render, screen, fireEvent } from '@testing-library/react';
import Timeline from '../Timeline';
import type { TimelineSegment } from '../../../types';

describe('Timeline', () => {
  const mockSegments: TimelineSegment[] = [
    {
      name: 'intro',
      start: 0,
      end: 5,
      effects: ['zoom'],
      beats: [1, 2],
      captions: [],
    },
    {
      name: 'main',
      start: 5,
      end: 10,
      effects: [],
      beats: [],
      captions: [{ text: 'Hello', start: 5, end: 6 }],
    },
  ];

  it('should render all segments', () => {
    const mockOnSelect = jest.fn();
    render(
      <Timeline
        segments={mockSegments}
        selectedIndex={0}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('intro')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('0.00–5.00s')).toBeInTheDocument();
    expect(screen.getByText('5.00–10.00s')).toBeInTheDocument();
  });

  it('should highlight the selected segment', () => {
    const mockOnSelect = jest.fn();
    const { container } = render(
      <Timeline
        segments={mockSegments}
        selectedIndex={1}
        onSelect={mockOnSelect}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).not.toHaveClass('border-emerald-400');
    expect(buttons[1]).toHaveClass('border-emerald-400');
  });

  it('should call onSelect when clicking a segment', () => {
    const mockOnSelect = jest.fn();
    render(
      <Timeline
        segments={mockSegments}
        selectedIndex={0}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('main'));
    expect(mockOnSelect).toHaveBeenCalledWith(1);
  });
});
