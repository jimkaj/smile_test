// Video manifest for the smile_test quiz.
// Each clip shows a person smiling; the task is to judge whether the smile is
// genuine ("Genuine") or posed ("Fake"). Convention: correctAnswer/chosen use
// the literal strings "G" (Genuine) and "F" (Fake) for scoring;
// DEFAULT_OPTION_LABELS below is the cosmetic button text and never affects
// scoring. answerImage points at that video's answer-key graphic, shown on
// the summary screen; filenames use each file's exact on-disk case (mixed
// .jpg/.JPG as delivered) since GitHub Pages is case-sensitive.
export const DEFAULT_OPTION_LABELS = { g: "Genuine", f: "Fake" };

export const VIDEOS = [
  { id: "v01", label: "Video 1", sourceType: "direct", url: "data/smilecontent-q01.mp4", correctAnswer: "G", answerImage: "data/Smile01Answer.jpg" },
  { id: "v02", label: "Video 2", sourceType: "direct", url: "data/smilecontent-q02.mp4", correctAnswer: "F", answerImage: "data/Smile02Answer.JPG" },
  { id: "v03", label: "Video 3", sourceType: "direct", url: "data/smilecontent-q03.mp4", correctAnswer: "F", answerImage: "data/Smile03Answer.JPG" },
  { id: "v04", label: "Video 4", sourceType: "direct", url: "data/smilecontent-q04.mp4", correctAnswer: "F", answerImage: "data/Smile04Answer.JPG" },
  { id: "v05", label: "Video 5", sourceType: "direct", url: "data/smilecontent-q05.mp4", correctAnswer: "G", answerImage: "data/Smile05Answer.JPG" },
  { id: "v06", label: "Video 6", sourceType: "direct", url: "data/smilecontent-q06.mp4", correctAnswer: "G", answerImage: "data/Smile06Answer.JPG" },
  { id: "v07", label: "Video 7", sourceType: "direct", url: "data/smilecontent-q07.mp4", correctAnswer: "F", answerImage: "data/Smile07Answer.JPG" },
  { id: "v08", label: "Video 8", sourceType: "direct", url: "data/smilecontent-q08.mp4", correctAnswer: "G", answerImage: "data/Smile08Answer.jpg" },
  { id: "v09", label: "Video 9", sourceType: "direct", url: "data/smilecontent-q09.mp4", correctAnswer: "F", answerImage: "data/Smile09Answer.jpg" },
  { id: "v10", label: "Video 10", sourceType: "direct", url: "data/smilecontent-q10.mp4", correctAnswer: "G", answerImage: "data/Smile10Answer.JPG" },
  { id: "v11", label: "Video 11", sourceType: "direct", url: "data/smilecontent-q11.mp4", correctAnswer: "G", answerImage: "data/Smile11Answer.JPG" },
  { id: "v12", label: "Video 12", sourceType: "direct", url: "data/smilecontent-q12.mp4", correctAnswer: "F", answerImage: "data/Smile12Answer.JPG" },
  { id: "v13", label: "Video 13", sourceType: "direct", url: "data/smilecontent-q13.mp4", correctAnswer: "F", answerImage: "data/Smile13Answer.JPG" },
  { id: "v14", label: "Video 14", sourceType: "direct", url: "data/smilecontent-q14.mp4", correctAnswer: "F", answerImage: "data/Smile14Answer.JPG" },
  { id: "v15", label: "Video 15", sourceType: "direct", url: "data/smilecontent-q15.mp4", correctAnswer: "G", answerImage: "data/Smile15Answer.JPG" },
  { id: "v16", label: "Video 16", sourceType: "direct", url: "data/smilecontent-q16.mp4", correctAnswer: "G", answerImage: "data/Smile16Answer.jpg" },
  { id: "v17", label: "Video 17", sourceType: "direct", url: "data/smilecontent-q17.mp4", correctAnswer: "G", answerImage: "data/Smile17Answer.JPG" },
  { id: "v18", label: "Video 18", sourceType: "direct", url: "data/smilecontent-q18.mp4", correctAnswer: "F", answerImage: "data/Smile18Answer.JPG" },
  { id: "v19", label: "Video 19", sourceType: "direct", url: "data/smilecontent-q19.mp4", correctAnswer: "G", answerImage: "data/Smile19Answer.JPG" },
  { id: "v20", label: "Video 20", sourceType: "direct", url: "data/smilecontent-q20.mp4", correctAnswer: "F", answerImage: "data/Smile20Answer.JPG" },
];

export const COMBINED_ANSWER_IMAGE = "data/SmileAnswers.jpg";
