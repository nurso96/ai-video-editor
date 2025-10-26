import { render, screen } from '@testing-library/react';
import VideoPreview from '../VideoPreview';

describe('VideoPreview', () => {
  it('should render the upload message when no video source is provided', () => {
    render(<VideoPreview videoSrc={null} />);
    expect(screen.getByText('Upload a clip to preview the timeline.')).toBeInTheDocument();
  });

  it('should render the video when a video source is provided', () => {
    render(<VideoPreview videoSrc="/test.mp4" />);
    const video = screen.getByTestId('video-preview');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/test.mp4');
  });
});
