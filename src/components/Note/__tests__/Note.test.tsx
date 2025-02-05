import {fireEvent} from "@testing-library/react";
import {Note} from "components/Note";
import {wrapWithTestBackend} from "react-dnd-test-utils";
import {Provider} from "react-redux";
import {Actions} from "store/action";
import {render} from "testUtils";
import getTestStore from "utils/test/getTestStore";
import getTestParticipant from "utils/test/getTestParticipant";
import * as reactRouter from "react-router";
import * as reactRedux from "react-redux";
import {ApplicationState} from "types";
import {ViewState} from "types/view";
import {BoardState} from "types/board";
import getTestApplicationState from "utils/test/getTestApplicationState";
import getTestNote from "utils/test/getTestNote";

const NOTE_ID = "test-notes-id-1";

const createBoardData = (overwrite?: Partial<BoardState["data"]> & Partial<Pick<BoardState, "status">>): BoardState => {
  return {
    status: overwrite?.status ?? "ready",
    data: {
      id: overwrite?.id ?? "note-tests-board",
      name: overwrite?.name ?? "note-tests-board",
      accessPolicy: overwrite?.accessPolicy ?? "PUBLIC",
      showAuthors: overwrite?.showAuthors ?? false,
      showNotesOfOtherUsers: overwrite?.showNotesOfOtherUsers ?? true,
      allowStacking: overwrite?.allowStacking ?? true,
    },
  };
};

const createNote = (isModerator: boolean, overwrite?: Partial<ApplicationState>) => {
  const [NoteContext] = wrapWithTestBackend(Note);
  return (
    <Provider store={getTestStore(overwrite)}>
      <NoteContext key={NOTE_ID} noteId={NOTE_ID} viewer={getTestParticipant(isModerator ? {role: "MODERATOR"} : {role: "PARTICIPANT"})} />
    </Provider>
  );
};

describe("Note", () => {
  beforeEach(() => {
    window.IntersectionObserver = jest.fn(
      () =>
        ({
          observe: jest.fn(),
          disconnect: jest.fn(),
        } as unknown as IntersectionObserver)
    );
  });

  describe("content", () => {
    it("should display the text content of the note", () => {
      const note = getTestApplicationState().notes.find((n) => n.id === NOTE_ID);
      expect(note).toBeDefined();
      const {container} = render(createNote(false));
      expect(container.firstChild).toHaveTextContent(note!.text);
    });

    test("own note author name is me", () => {
      const {container} = render(createNote(false, {notes: [getTestNote({id: "test-notes-id-1", author: getTestParticipant().user.id})]}));
      expect(container.firstChild).toHaveTextContent("Me");
    });
  });

  describe("author information", () => {
    it("should be displayed on enabled author visibility", () => {
      const board = createBoardData({showAuthors: true});
      const {container} = render(createNote(false, {board: board}));
      expect(container.firstChild).toContainHTML("figure");
    });
    it("should not be displayed on disabled author visibility", () => {
      const board = createBoardData({showAuthors: false});
      const {container} = render(createNote(false, {board: board}));
      expect(container.firstChild).not.toContainHTML("figure");
    });
  });

  describe("votes", () => {
    it("should contain votes container element", () => {
      const {container} = render(createNote(false));
      expect(container.getElementsByClassName("votes").length).toBeGreaterThan(0);
    });
  });

  describe("side effects", () => {
    it("should share note during active moderation on click", () => {
      const dispatchSpy = jest.fn();
      jest.spyOn(reactRedux, "useDispatch").mockImplementationOnce(() => dispatchSpy);
      const view: ViewState = {
        moderating: true,
        serverTimeOffset: 0,
        feedbackEnabled: false,
        enabledAuthProvider: [],
        hotkeysAreActive: false,
      };
      const {container} = render(createNote(true, {view}));
      fireEvent.click(container.querySelector(".note")!);
      expect(dispatchSpy).toHaveBeenCalledWith(Actions.shareNote(NOTE_ID));
    });
    it("should navigate to stack route on click", () => {
      const navigateSpy = jest.fn();
      jest.spyOn(reactRouter, "useNavigate").mockImplementationOnce(() => navigateSpy);
      const {container} = render(createNote(false));
      fireEvent.click(container.querySelector(".note")!);
      expect(navigateSpy).toHaveBeenCalledWith(`note/${NOTE_ID}/stack`);
    });
  });
});
