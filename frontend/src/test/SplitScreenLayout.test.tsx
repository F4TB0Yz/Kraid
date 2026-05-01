import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplitScreenLayout } from '../core/presentation/layouts/SplitScreenLayout';

describe('SplitScreenLayout', () => {
  it('renders left and right panels', () => {
    render(
      <SplitScreenLayout
        leftPanel={<div>Left Panel</div>}
        rightPanel={<div>Right Panel</div>}
      />
    );

    expect(screen.getByText('Left Panel')).toBeInTheDocument();
    expect(screen.getByText('Right Panel')).toBeInTheDocument();
  });

  it('hides right panel when showRightPanel is false', () => {
    render(
      <SplitScreenLayout
        leftPanel={<div>Left Panel</div>}
        rightPanel={<div>Right Panel</div>}
        showRightPanel={false}
      />
    );

    expect(screen.getByText('Left Panel')).toBeInTheDocument();
    expect(screen.queryByText('Right Panel')).not.toBeInTheDocument();
  });
});
