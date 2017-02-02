import { UiEditorPage } from './app.po';

describe('ui-editor App', function() {
  let page: UiEditorPage;

  beforeEach(() => {
    page = new UiEditorPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
