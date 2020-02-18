// Converts a boolean into a unicode icon
const sym = b => b
  ? '<span class="icon" style="color:green;">✔</span>'
  : '<span class="icon" style="color:red;">✘</span>';

// An async function that resolves after `ms` milliseconds.
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Checks the default MIME types of `MediaRecorder` for video only input and
// audio+video input.
const getDefaultMime = async () => {
  const videoOnly = document.getElementById('videoOnlyInput');
  const withAudio = document.getElementById('withAudioInput');

  let fn = null;
  if (typeof videoOnly.captureStream === "function") {
    fn = 'captureStream';
  } else if (typeof videoOnly.mozCaptureStream === "function") {
    fn = 'mozCaptureStream';
  }

  let body;
  if (fn) {
    const getMime = async elem => {
      const stream = elem[fn]();

      // Wait for the stream to be ready
      while (!stream.active) {
        await sleep(50);
      }

      // Start a recorder to get a data blob.
      const rec = new MediaRecorder(stream);
      let blobMime;

      elem.play();
      rec.start(100);
      await new Promise(resolve => {
        rec.ondataavailable = blob => {
          rec.ondataavailable = null;
          blobMime = blob.data.type;
          resolve();
        };
      });
      if (rec.state === 'recording') {
        rec.stop();
      }

      // Collect information
      const mimeType = blobMime || rec.mimeType;
      const mimeOut = mimeType === "" ? "<i>unknown</i>" : `<code>${mimeType}</code>`;
      const aBitrate = Math.round(rec.audioBitsPerSecond / 1024);
      const vBitrate = Math.round(rec.videoBitsPerSecond / 1024);
      const bitrates = `(video ${vBitrate} KiBit/s, audio ${aBitrate} KiBit/s)`;

      return `${mimeOut} ${bitrates}`;
    };

    body = `
      (Tested by creating a <code>MediaRecorder</code> with simple video streams)
      <ul>
        <li>Video only stream: ${await getMime(videoOnly)}</li>
        <li>Video+audio stream: ${await getMime(withAudio)}</li>
      </ul>
    `;
  } else {
    body = `
      Can't check default MIME types as <code>captureStream</code> on
      <code>video</code> elements is not supported. :(
    `;
  }

  return `
    <h2>Default MIME-Types of <code>MediaRecorder</code></h2>
    ${body}
  `;
};

// Checks a bunch of popular MIME types.
const getSupportedMimes = () => {
  const canCheckMime = 'isTypeSupported' in MediaRecorder;

  let body;
  if (canCheckMime) {
    let mimeRows = "";
    const mimes = [
      'video/webm',
      'video/webm;codecs="vp9"',
      'video/webm;codecs="vp8"',
      'video/webm;codecs="h264"',
      'video/webm;codecs="avc1"',
      'audio/webm',
      'audio/webm;codecs="opus"',
      'audio/webm;codecs="vorbis"',
      'video/x-matroska',
      'video/x-matroska;codecs="avc1"',
      'video/mp4',
      'video/mp4;codecs="vp9"',
      'video/mp4;codecs="vp8"',
      'video/mp4;codecs="h264"',
      'video/mp4;codecs="avc1"',
    ];

    for (const mime of mimes) {
      const isSupported = MediaRecorder.isTypeSupported(mime);
      mimeRows += `
        <tr>
          <td>${sym(isSupported)}</td>
          <td><code>${mime}</code></td>
        </tr>
      `;
    }

    body = `
      (Tested with <code>MediaRecorder.isTypeSupported</code>)
      <br>
      <br>
      <table>
        <tbody>
          ${mimeRows}
        </tbody>
      </table>
    `;
  } else {
    body = `
      <code>MediaRecorder.isTypeSupported</code> is not supported by your browser :(
    `;
  }

  return `
    <h2>Supported MIME-Types</h2>
    ${body}
  `;
}


(async () => {
  // Base Support
  const isMediaRecorderSupported = typeof MediaRecorder !== 'undefined';
  const isUserCaptureSupported = 'mediaDevices' in navigator
    && 'getUserMedia' in navigator.mediaDevices;
  const isDisplayCaptureSupported = 'mediaDevices' in navigator
    && 'getDisplayMedia' in navigator.mediaDevices;

  const out = document.getElementById('results');
  const baseSupport = `
    <h2>Base support</h2>
    <table>
      <tbody>
        <tr>
          <td>${sym(isMediaRecorderSupported)}</td>
          <td><code>MediaRecorder</code></td>
        </tr>
        <tr>
          <td>${sym(isUserCaptureSupported)}</td>
          <td><code>getUserMedia</code></td>
        </tr>
        <tr>
          <td>${sym(isDisplayCaptureSupported)}</td>
          <td><code>getDisplayMedia</code></td>
        </tr>
      </tbody>
    </table>
  `;

  // MIME Types
  const defaultMime = isMediaRecorderSupported ? await getDefaultMime() : "";
  const supportedMimes = isMediaRecorderSupported ? getSupportedMimes() : "";

  // Combine everything
  out.innerHTML = baseSupport + defaultMime + supportedMimes;
})();
