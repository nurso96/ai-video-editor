import { useEditorStore } from '../editorStore';

describe('editorStore', () => {
  it('should have the correct initial state', () => {
    const { project, selectedSegmentIndex, saving, rendering, jobId, renderStatus, error, toast } = useEditorStore.getState();
    expect(project).toBeNull();
    expect(selectedSegmentIndex).toBe(0);
    expect(saving).toBe(false);
    expect(rendering).toBe(false);
    expect(jobId).toBeNull();
    expect(renderStatus).toBeNull();
    expect(error).toBeNull();
    expect(toast).toBeNull();
  });

  it('should set the project', () => {
    const { setProject } = useEditorStore.getState();
    const project = { id: 1, title: 'Test Project' };
    setProject(project as any);
    expect(useEditorStore.getState().project).toEqual(project);
  });
});
