import { useState, useRef, useEffect } from "react";
import styles from "./WineScanner.module.css";

function ScanResult({ result, onReset }) {
  return (
    <div className={styles.result}>
      <div className={styles.resultBanner}>
        <span className={styles.resultIcon}>◈</span>
        {result.confidence && (
          <span className={`${styles.confidence} ${styles[result.confidence]}`}>
            {result.confidence} confidence
          </span>
        )}
      </div>

      <div className={styles.resultContent}>
        <div className={styles.resultHeader}>
          {result.region && (
            <span className={styles.resultRegion}>{result.region}</span>
          )}
          <h2 className={styles.resultName}>{result.name}</h2>
        </div>

        <div className={styles.stats}>
          {result.vintage && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Vintage</span>
              <span className={styles.statValue}>{result.vintage}</span>
            </div>
          )}
          {result.rating && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Est. Rating</span>
              <span className={styles.statValue}>{result.rating} / 5</span>
            </div>
          )}
          {result.priceRange && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Price Range</span>
              <span className={styles.statValue}>{result.priceRange}</span>
            </div>
          )}
        </div>

        {result.grapes?.length > 0 && (
          <section>
            <h4 className={styles.sectionTitle}>Grape Varieties</h4>
            <div className={styles.chips}>
              {result.grapes.map((g) => (
                <span key={g} className={styles.grapeChip}>{g}</span>
              ))}
            </div>
          </section>
        )}

        {result.notes && (
          <section>
            <h4 className={styles.sectionTitle}>Tasting Notes</h4>
            <p className={styles.notes}>{result.notes}</p>
          </section>
        )}

        {result.pairings?.length > 0 && (
          <section>
            <h4 className={styles.sectionTitle}>Food Pairings</h4>
            <div className={styles.chips}>
              {result.pairings.map((p) => (
                <span key={p} className={styles.chip}>{p}</span>
              ))}
            </div>
          </section>
        )}

        <button className={styles.resetBtn} onClick={onReset}>
          Scan Another Label
        </button>
      </div>
    </div>
  );
}

function CameraView({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied. Please allow camera access and try again.");
      }
    }
    startCamera();
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const b64 = dataUrl.split(",")[1];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(dataUrl, b64, "image/jpeg");
  }

  if (error) {
    return (
      <div className={styles.cameraError}>
        <p className={styles.errorMsg}>{error}</p>
        <label className={styles.secondaryBtn} htmlFor="scanner-upload-fallback">
          Upload a Photo Instead
        </label>
        <input
          id="scanner-upload-fallback"
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target.result;
              const b64 = dataUrl.split(",")[1];
              const mime = dataUrl.match(/:(.*?);/)[1];
              onCapture(dataUrl, b64, mime);
            };
            reader.readAsDataURL(file);
          }}
        />
        <button className={styles.ghostBtn} onClick={onCancel}>Cancel</button>
      </div>
    );
  }

  return (
    <div className={styles.cameraWrap}>
      <video
        ref={videoRef}
        className={styles.cameraVideo}
        autoPlay
        playsInline
        muted
        onCanPlay={() => setReady(true)}
      />
      <div className={styles.cameraOverlay}>
        <div className={styles.scanFrame} />
        <p className={styles.cameraHint}>Center the wine label in the frame</p>
      </div>
      <div className={styles.cameraControls}>
        <button className={styles.ghostBtn} onClick={onCancel}>Cancel</button>
        <button
          className={styles.shutterBtn}
          onClick={capture}
          disabled={!ready}
          aria-label="Capture"
        />
        <div style={{ width: 64 }} />
      </div>
    </div>
  );
}

export function WineScanner() {
  const [state, setState] = useState("idle"); // idle | camera | preview | analyzing | result | error
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  function handleCapture(dataUrl, b64, mime) {
    setPreview(dataUrl);
    setImageData(b64);
    setMediaType(mime);
    setState("preview");
  }

  function handleUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const b64 = dataUrl.split(",")[1];
      const mime = dataUrl.match(/:(.*?);/)[1];
      handleCapture(dataUrl, b64, mime);
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    setState("analyzing");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, mediaType }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
        setState("error");
      } else {
        setResult(data);
        setState("result");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setPreview(null);
    setImageData(null);
    setMediaType(null);
    setResult(null);
    setErrorMsg("");
  }

  if (state === "camera") {
    return <CameraView onCapture={handleCapture} onCancel={reset} />;
  }

  if (state === "result") {
    return <ScanResult result={result} onReset={reset} />;
  }

  return (
    <div className={styles.container}>
      {state === "idle" && (
        <>
          <div className={styles.hero}>
            <div className={styles.heroMark}>⊡</div>
            <h2 className={styles.heroTitle}>Scan a Wine Label</h2>
            <p className={styles.heroSub}>
              Point your camera at any wine label and we'll instantly identify
              the wine, vintage, tasting notes, and more.
            </p>
          </div>
          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={() => setState("camera")}>
              <span className={styles.btnIcon}>◎</span>
              Open Camera
            </button>
            <label className={styles.secondaryBtn} htmlFor="scanner-upload">
              <span className={styles.btnIcon}>↑</span>
              Upload Photo
            </label>
            <input
              id="scanner-upload"
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={(e) => handleUpload(e.target.files[0])}
            />
          </div>
        </>
      )}

      {state === "preview" && (
        <div className={styles.previewWrap}>
          <img src={preview} alt="Wine label" className={styles.previewImg} />
          <div className={styles.previewActions}>
            <button className={styles.primaryBtn} onClick={analyze}>
              Identify Wine
            </button>
            <button className={styles.ghostBtn} onClick={reset}>
              Retake
            </button>
          </div>
        </div>
      )}

      {state === "analyzing" && (
        <div className={styles.analyzing}>
          <img src={preview} alt="Wine label" className={styles.previewImgDim} />
          <div className={styles.analyzingOverlay}>
            <div className={styles.spinner} />
            <p className={styles.analyzingText}>Identifying wine…</p>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>✕</span>
          <p className={styles.errorMsg}>{errorMsg}</p>
          <button className={styles.primaryBtn} onClick={reset}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
