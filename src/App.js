import React, { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./App.css";
import vocabulary from "./assets/vocabulary/day1";
import moment from "moment";
import { useSpeech } from "react-text-to-speech";
import { ReactComponent as SpeakerIcon } from "./assets/icon/speaker.svg";
import CorrectAudio from "./assets/audio/correct.mp3";
import InCorrectAudio from "./assets/audio/error.mp3";
import axios from "axios";

const App = () => {
  const [countTime, setCountTime] = useState(7);
  const [retry, setRetry] = useState(3);
  const [meanValue, setMeanValue] = useState("");
  const [position, setPosition] = useState(0);
  const [finish, setFinish] = useState(false);
  const [readingSuccess, setReadingSuccess] = useState(false);
  const [canRetry, setCanRetry] = useState(true);
  const [hintWord, setHintWord] = useState("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const { speechStatus, start } = useSpeech({
    text: vocabulary[position]?.word,
  });

  const handlePlaySystemAudio = (audio) => {
    switch (audio) {
      case "correct":
        {
          const audio = new Audio(CorrectAudio);
          audio.play();
        }
        break;
      case "incorrect":
        {
          const audio = new Audio(InCorrectAudio);
          audio.play();
        }
        break;
      default:
        break;
    }
  };

  const handleTryAgain = () => {
    setCountTime(7);
    setRetry(3);
    setMeanValue("");
    setPosition(0);
    setFinish(false);
    setReadingSuccess(false);
    setCanRetry(true);
  };

  const handleStartSpeaking = () => {
    SpeechRecognition.startListening();
    const interval = setInterval(() => {
      setCountTime((prev) => {
        if (prev > 0) {
          return prev - 1;
        } else {
          clearInterval(interval);
          setCanRetry(false);
          SpeechRecognition.stopListening();
          return 7;
        }
      });
    }, 1000);
  };

  useEffect(() => {
    if (countTime === 0) {
      if (
        transcript?.toLowerCase() === vocabulary[position]?.word?.toLowerCase()
      ) {
        handlePlaySystemAudio("correct");
        setReadingSuccess(true);
      } else {
        handlePlaySystemAudio("incorrect");
      }
    }
  }, [transcript, position, countTime]);

  const handleSubmitMeaning = () => {
    if (
      meanValue?.toLowerCase() === vocabulary[position]?.meaning?.toLowerCase()
    ) {
      handlePlaySystemAudio("correct");
      setRetry(3);
      setCountTime(7);
      resetTranscript();
      setCanRetry(true);
      setReadingSuccess(false);
      setPosition((prev) => {
        if (vocabulary.length > prev + 1) {
          return prev + 1;
        } else {
          setFinish(true);
          axios
            .get("https://api.habit.io.vn/mailer")
            .catch((error) => console.log(error));
          return 0;
        }
      });
    } else {
      handlePlaySystemAudio("incorrect");
    }
    setMeanValue("");
  };

  const handleHintWord = (type) => {
    if (type === "all") setHintWord(vocabulary[position]?.meaning);
    else setHintWord(vocabulary[position]?.meaning?.charAt(0));
  };

  const handleRetry = () => {
    resetTranscript();
    setRetry((prev) => prev - 1);
    setCanRetry(true);
    if (listening) {
      setCountTime(0);
      SpeechRecognition.stopListening();
    } else {
      setCountTime(7);
    }
  };

  if (finish)
    return (
      <h1 style={{ textAlign: "center", width: "100%", marginTop: "30vh" }}>
        ALL DONE {moment(Date.now()).format("DD-MM-YYYY")}
      </h1>
    );

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <div style={{ paddingTop: 10, paddingRight: 12, paddingLeft: 12 }}>
      <p>Word position: {position + 1}</p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: -16,
          marginBottom: -16,
        }}
      >
        <p>Reading Word: {vocabulary?.[position].word}</p>
        <button
          disabled={speechStatus === "started"}
          onClick={start}
          style={{
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            opacity: speechStatus === "started" ? 0.5 : 1,
          }}
        >
          <SpeakerIcon />
        </button>
      </div>
      <p>Spelling: {vocabulary?.[position].spelling}</p>
      <div style={{ display: readingSuccess ? "block" : "none" }}>
        <span style={{ marginRight: 16 }}>Meaning</span>
        <span
          onClick={() => handleHintWord("1")}
          style={{
            marginRight: 16,
            color: "blue",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Help
        </span>
        <span
          onClick={() => handleHintWord("all")}
          style={{
            color: "blue",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Hint
        </span>
        <br />
        <p style={{ marginTop: 4, marginBottom: 4 }}>{hintWord}</p>
        <input
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmitMeaning();
            }
          }}
          style={{ marginRight: 12, marginBottom: 8, marginTop: 8 }}
          value={meanValue}
          onChange={(e) => setMeanValue(e.target.value ?? "")}
          type="text"
        />
        <button onClick={handleSubmitMeaning}>submit</button>
      </div>
      <hr />
      <p>Microphone: {listening ? "on" : "off"}</p>
      <p>Countdown: {countTime}</p>

      <button
        disabled={listening || !canRetry || countTime !== 7}
        style={{ marginRight: 12 }}
        onClick={handleStartSpeaking}
      >
        Start
      </button>
      <button disabled={!retry || countTime !== 7} onClick={handleRetry}>
        Retry ({retry})
      </button>
      <button
        style={{
          display: !retry && !canRetry ? "block" : "none",
          marginTop: 16,
        }}
        onClick={handleTryAgain}
      >
        Try again
      </button>
      <p>{transcript}</p>
    </div>
  );
};

export default App;
