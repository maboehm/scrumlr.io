import {useNavigate} from "react-router";
import {useTranslation} from "react-i18next";
import {Timer} from "components/Timer";
import {VoteDisplay} from "components/Votes/VoteDisplay";
import ReactDOM from "react-dom";
import _ from "underscore";
import {useAppSelector} from "store";
import {TooltipButton} from "components/TooltipButton/TooltipButton";
import {ReactComponent as ShareIcon} from "assets/icon-share.svg";
import "./Infobar.scss";

export const InfoBar = () => {
  const navigate = useNavigate();
  const {t} = useTranslation();
  const state = useAppSelector(
    (applicationState) => ({
      endTime: applicationState.board.data?.timerEnd,
      activeVoting: Boolean(applicationState.votings.open),
      possibleVotes: applicationState.votings.open?.voteLimit,
      usedVotes: applicationState.votes.filter((v) => v.voting === applicationState.votings.open?.id).length,
      sharedNote: applicationState.board.data?.sharedNote,
    }),
    _.isEqual
  );

  return ReactDOM.createPortal(
    <aside className="info-bar">
      {state.endTime && <Timer endTime={state.endTime} />}
      {state.activeVoting && <VoteDisplay usedVotes={state.usedVotes} possibleVotes={state.possibleVotes!} />}
      {state.sharedNote && (
        <TooltipButton
          className="info-bar__return-to-focused-note-button"
          icon={ShareIcon}
          direction="right"
          label={t("InfoBar.ReturnToFocusedNote")}
          onClick={() => navigate(`note/${state.sharedNote}/stack`)}
        />
      )}
    </aside>,
    document.getElementById("root")!
  );
};
