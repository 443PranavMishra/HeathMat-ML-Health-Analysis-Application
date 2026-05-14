const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

const stars = Array.from({ length: 260 }, () => ({
  x: Math.random() * innerWidth,
  y: Math.random() * innerHeight,
  r: .3 + Math.random() * 1,
  a: Math.random(),
  s: .001 + Math.random() * .004,
  c: Math.random() > .35 ? "rgba(251,113,133," : "rgba(167,139,250,"
}));

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    star.a += star.s;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = star.c + (0.1 + .6 * Math.abs(Math.sin(star.a))) + ")";
    ctx.fill();
  });
  requestAnimationFrame(draw);
}
draw();

const bindRange = (id, out, format = value => value) => {
  const input = document.getElementById(id);
  const output = document.getElementById(out);
  input.addEventListener("input", () => output.textContent = format(input.value));
};

bindRange("age", "ageVal");
bindRange("trestbps", "bpVal");
bindRange("chol", "cholVal");
bindRange("thalach", "hrVal");
bindRange("oldpeak", "oldpeakVal", v => Number(v).toFixed(1));

let chartDonut, chartRadar, chartBar, chartVitals;
const chartText = "rgba(240,240,255,.6)";
const grid = "rgba(255,255,255,.07)";

function destroy(chart) {
  if (chart) chart.destroy();
}

function setError(message) {
  error.style.display = message ? "block" : "none";
  error.textContent = message || "";
}

async function runHeartPrediction() {
  setError("");
  predictBtn.textContent = "Analyzing...";
  predictBtn.disabled = true;

  const payload = {
    Age: age.value,
    Sex: sex.value,
    ChestPainType: cp.value,
    RestingBP: trestbps.value,
    Cholesterol: chol.value,
    FastingBS: fbs.value,
    RestingECG: restecg.value,
    MaxHR: thalach.value,
    ExerciseAngina: exang.value,
    Oldpeak: oldpeak.value,
    ST_Slope: slope.value
  };

  try {
    const res = await fetch("/predict_heart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error((data.error || "Prediction failed") + "\n" + (data.details || ""));
    }

    renderHeartResults(data);
  } catch (err) {
    setError("Could not complete prediction: " + err.message);
  } finally {
    predictBtn.textContent = "Analyze Heart Disease Risk";
    predictBtn.disabled = false;
  }
}

function statusClass(type) {
  return type === "good" ? "good" : type === "warn" ? "warn" : "bad";
}

function renderHeartResults(d) {
  const highRisk = d.prediction === 1;
  const score = Math.round(d.risk_score);
  const inp = d.input;
  const f = d.factors;

  resultBox.className = "result " + (highRisk ? "high" : "low");
  badge.className = "badge " + (highRisk ? "bad" : "good");
  badge.textContent = highRisk ? "Heart Disease Risk Detected" : "Low Heart Disease Risk";
  title.textContent = highRisk ? "Elevated cardiac risk" : "Heart profile looks safer";
  subtitle.textContent = highRisk
    ? `Model probability shows ${score}% heart disease risk. Please consult a cardiologist.`
    : `Model probability shows ${score}% heart disease risk. Keep protecting your heart health.`;

  riskFill.style.background = highRisk
    ? "linear-gradient(90deg,#ffb84d,#fb7185)"
    : "linear-gradient(90deg,#2ee6a6,#a78bfa)";
  riskFill.style.width = score + "%";
  riskScore.textContent = score + "%";
  riskScore.style.color = highRisk ? "#fb7185" : "#2ee6a6";

  const ageNum = Number(inp.Age);
  const bp = Number(inp.RestingBP);
  const cholesterol = Number(inp.Cholesterol);
  const hr = Number(inp.MaxHR);
  const old = Number(inp.Oldpeak);

  const statItems = [
    ["Age", ageNum + " yrs", ageNum < 45 ? "Younger" : ageNum < 60 ? "Middle-aged" : "Senior", ageNum < 45 ? "good" : ageNum < 60 ? "warn" : "bad"],
    ["Resting BP", bp + " mmHg", bp < 120 ? "Normal" : bp < 140 ? "Elevated" : "High", bp < 120 ? "good" : bp < 140 ? "warn" : "bad"],
    ["Cholesterol", cholesterol + " mg/dL", cholesterol < 200 ? "Desirable" : cholesterol < 240 ? "Borderline" : "High", cholesterol < 200 ? "good" : cholesterol < 240 ? "warn" : "bad"],
    ["Max Heart Rate", hr + " bpm", hr >= 150 ? "Good Response" : hr >= 120 ? "Moderate" : "Low", hr >= 150 ? "good" : hr >= 120 ? "warn" : "bad"],
    ["Exercise Angina", inp.ExerciseAngina === "Y" ? "Yes" : "No", inp.ExerciseAngina === "Y" ? "Risk Factor" : "Clear", inp.ExerciseAngina === "Y" ? "bad" : "good"],
    ["Oldpeak", old.toFixed(1), old < 1 ? "Low" : old < 2.5 ? "Moderate" : "High", old < 1 ? "good" : old < 2.5 ? "warn" : "bad"],
    ["ST Slope", inp.ST_Slope, inp.ST_Slope === "Up" ? "Better" : "Review", inp.ST_Slope === "Up" ? "good" : "warn"],
    ["Risk Level", d.risk_level, d.risk_level + " Risk", score < 30 ? "good" : score < 70 ? "warn" : "bad"]
  ];

  stats.innerHTML = statItems.map(s => `
    <div class="stat">
      <small>${s[0]}</small>
      <strong>${s[1]}</strong>
      <span class="pill ${statusClass(s[3])}">${s[2]}</span>
    </div>
  `).join("");

  destroy(chartDonut);
  destroy(chartRadar);
  destroy(chartBar);
  destroy(chartVitals);

  chartDonut = new Chart(donut, {
    type: "doughnut",
    data: {
      labels: ["Heart Risk", "Healthy"],
      datasets: [{
        data: [d.probability_yes, d.probability_no],
        backgroundColor: ["rgba(251,113,133,.85)", "rgba(46,230,166,.8)"],
        borderColor: ["#fb7185", "#2ee6a6"],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: { legend: { position: "bottom", labels: { color: chartText } } }
    }
  });

  chartRadar = new Chart(radar, {
    type: "radar",
    data: {
      labels: ["Age", "BP", "Chol", "Heart Rate", "Oldpeak", "Fasting Sugar"],
      datasets: [{
        data: [
          f.age_score,
          f.bp_score,
          f.chol_score,
          f.hr_score,
          f.oldpeak_score,
          f.fasting_score
        ],
        backgroundColor: highRisk ? "rgba(251,113,133,.15)" : "rgba(46,230,166,.14)",
        borderColor: highRisk ? "#fb7185" : "#2ee6a6",
        pointBackgroundColor: highRisk ? "#fb7185" : "#2ee6a6"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { r: { min: 0, max: 100, grid: { color: grid }, ticks: { display: false }, pointLabels: { color: chartText } } },
      plugins: { legend: { display: false } }
    }
  });

  chartBar = new Chart(bar, {
    type: "bar",
    data: {
      labels: ["Age", "BP", "Chol", "HR", "Oldpeak", "FBS"],
      datasets: [{
        data: [
          f.age_score,
          f.bp_score,
          f.chol_score,
          f.hr_score,
          f.oldpeak_score,
          f.fasting_score
        ],
        backgroundColor: ["#a78bfa", "#fb7185", "#e11d48", "#2ee6a6", "#ffb84d", "#7c3aed"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: grid }, ticks: { color: chartText } },
        y: { min: 0, max: 100, grid: { color: grid }, ticks: { color: chartText } }
      },
      plugins: { legend: { display: false } }
    }
  });

  chartVitals = new Chart(vitals, {
    type: "bar",
    data: {
      labels: ["BP", "Cholesterol", "Max HR"],
      datasets: [{
        label: "Your value",
        data: [bp, cholesterol, hr],
        backgroundColor: ["#fb7185", "#a78bfa", "#2ee6a6"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: grid }, ticks: { color: chartText } },
        y: { grid: { color: grid }, ticks: { color: chartText } }
      },
      plugins: { legend: { display: false } }
    }
  });

  reports.innerHTML = `
    <div class="report-card">
      <h3>Key Findings</h3>
      <p><b>Blood pressure:</b> ${bp} mmHg. ${bp < 120 ? "This is in a healthier range." : bp < 140 ? "This is elevated and should be monitored." : "This is high and needs medical attention."}</p>
      <p><b>Cholesterol:</b> ${cholesterol} mg/dL. ${cholesterol < 200 ? "Desirable range." : cholesterol < 240 ? "Borderline high." : "High cholesterol range."}</p>
      <p><b>Exercise angina:</b> ${inp.ExerciseAngina === "Y" ? "Present, which is an important warning feature." : "Not reported."}</p>
    </div>

    <div class="report-card">
      <h3>Model Output</h3>
      <p><b>Prediction:</b> ${highRisk ? "Heart disease risk detected" : "Lower heart disease risk"}</p>
      <p><b>Risk level:</b> ${d.risk_level}</p>
      <p><b>Probability:</b> risk ${d.probability_yes}%, healthy ${d.probability_no}%.</p>
    </div>
  `;

  results.style.display = "block";
  setTimeout(() => results.classList.add("show"), 30);
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}