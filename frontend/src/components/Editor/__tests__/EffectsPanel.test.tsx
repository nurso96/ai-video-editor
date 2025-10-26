import { render, screen, fireEvent } from '@testing-library/react';
import EffectsPanel from '../EffectsPanel';

describe('EffectsPanel', () => {
  it('should render effects list', () => {
    render(<EffectsPanel effects={['zoom', 'slowmo']} />);

    const textarea = screen.getByPlaceholderText('comma-separated effects');
    expect(textarea).toHaveValue('zoom, slowmo');
  });

  it('should call onChange when effects are edited', () => {
    const mockOnChange = jest.fn();
    render(<EffectsPanel effects={[]} onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('comma-separated effects');
    fireEvent.change(textarea, { target: { value: 'zoom, pan' } });

    expect(mockOnChange).toHaveBeenCalledWith('zoom, pan');
  });

  it('should display placeholder text when no effects', () => {
    render(<EffectsPanel effects={[]} />);

    const textarea = screen.getByPlaceholderText('comma-separated effects');
    expect(textarea).toHaveValue('');
  });
});
