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
  c: Math.random() > .55 ? "rgba(167,139,250," : "rgba(96,165,250,"
}));

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    star.a += star.s;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = star.c + (0.1 + .55 * Math.abs(Math.sin(star.a))) + ")";
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
bindRange("sleep_duration", "sleepVal", v => Number(v).toFixed(1));
bindRange("quality_sleep", "qualityVal");
bindRange("activity_level", "activityVal");
bindRange("stress_level", "stressVal");
bindRange("heart_rate", "heartRateVal");
bindRange("daily_steps", "stepsVal");
bindRange("blood_pressure", "bpVal", v => Number(v).toFixed(1));


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

async function runSleepPrediction() {
  setError("");
  predictBtn.textContent = "Analyzing...";
  predictBtn.disabled = true;

  const payload = {
    Gender: gender.value,
    Age: age.value,
    Occupation: occupation.value,
    "Sleep Duration": sleep_duration.value,
    "Quality of Sleep": quality_sleep.value,
    "Physical Activity Level": activity_level.value,
    "Stress Level": stress_level.value,
    "BMI Category": bmi_category.value,
    "Blood Pressure": blood_pressure.value,
    "Heart Rate": heart_rate.value,
    "Daily Steps": daily_steps.value
  };

  try {
    const res = await fetch("/predict_sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error((data.error || "Prediction failed") + "\n" + (data.details || ""));
    }

    renderSleepResults(data);
  } catch (err) {
    setError("Could not complete prediction: " + err.message);
  } finally {
    predictBtn.textContent = "Analyze Sleep Health";
    predictBtn.disabled = false;
  }
}

function statusClass(type) {
  return type === "good" ? "good" : type === "warn" ? "warn" : "bad";
}

function renderSleepResults(d) {
  const highRisk = d.risk_score >= 40;
  const score = Math.round(d.risk_score);
  const inp = d.input;
  const f = d.factors;

  resultBox.className = "result " + (highRisk ? "high" : "low");
  badge.className = "badge " + (highRisk ? "bad" : "good");
  badge.textContent = highRisk ? "Sleep Disorder Risk Detected" : "Low Sleep Disorder Risk";
  title.textContent = d.prediction_label || "Sleep Health Result";
  subtitle.textContent = highRisk
    ? `Model indicates ${score}% sleep disorder risk. Consider improving routine and consulting a doctor if symptoms persist.`
    : `Model indicates ${score}% sleep disorder risk. Your sleep profile appears comparatively safer.`;

  riskFill.style.background = highRisk
    ? "linear-gradient(90deg,#ffb84d,#fb7185)"
    : "linear-gradient(90deg,#2ee6a6,#a78bfa)";
  riskFill.style.width = score + "%";
  riskScore.textContent = score + "%";
  riskScore.style.color = highRisk ? "#fb7185" : "#a78bfa";

  const sleep = Number(inp["Sleep Duration"]);
  const quality = Number(inp["Quality of Sleep"]);
  const activity = Number(inp["Physical Activity Level"]);
  const stress = Number(inp["Stress Level"]);
  const hr = Number(inp["Heart Rate"]);
  const steps = Number(inp["Daily Steps"]);

  const statItems = [
    ["Sleep Duration", sleep.toFixed(1) + " hrs", sleep >= 7 && sleep <= 9 ? "Healthy" : sleep >= 6 ? "Borderline" : "Low", sleep >= 7 && sleep <= 9 ? "good" : sleep >= 6 ? "warn" : "bad"],
    ["Sleep Quality", quality + "/10", quality >= 7 ? "Good" : quality >= 5 ? "Moderate" : "Poor", quality >= 7 ? "good" : quality >= 5 ? "warn" : "bad"],
    ["Stress", stress + "/10", stress <= 4 ? "Low" : stress <= 7 ? "Moderate" : "High", stress <= 4 ? "good" : stress <= 7 ? "warn" : "bad"],
    ["Activity", activity, activity >= 60 ? "Active" : activity >= 35 ? "Moderate" : "Low", activity >= 60 ? "good" : activity >= 35 ? "warn" : "bad"],
    ["BMI Category", inp["BMI Category"], inp["BMI Category"].includes("Normal") ? "Healthy" : "Review", inp["BMI Category"].includes("Normal") ? "good" : "warn"],
    ["Blood Pressure", inp["Blood Pressure"], inp["Blood Pressure"] === "120/80" ? "Ideal" : "Monitor", inp["Blood Pressure"] === "120/80" ? "good" : "warn"],
    ["Heart Rate", hr + " bpm", hr >= 60 && hr <= 80 ? "Normal" : "Review", hr >= 60 && hr <= 80 ? "good" : "warn"],
    ["Daily Steps", steps, steps >= 7000 ? "Good" : steps >= 4000 ? "Moderate" : "Low", steps >= 7000 ? "good" : steps >= 4000 ? "warn" : "bad"]
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

  const labels = Object.keys(d.probabilities || { "Risk": score, "Healthy": 100 - score });
  const values = Object.values(d.probabilities || { "Risk": score, "Healthy": 100 - score });

  chartDonut = new Chart(donut, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ["rgba(167,139,250,.85)", "rgba(251,113,133,.8)", "rgba(46,230,166,.75)"],
        borderColor: ["#a78bfa", "#fb7185", "#2ee6a6"],
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
      labels: ["Sleep", "Quality", "Activity", "Stress", "Heart Rate", "Steps"],
      datasets: [{
        data: [f.sleep_score, f.quality_score, f.activity_score, f.stress_score, f.heart_score, f.steps_score],
        backgroundColor: highRisk ? "rgba(251,113,133,.15)" : "rgba(167,139,250,.14)",
        borderColor: highRisk ? "#fb7185" : "#a78bfa",
        pointBackgroundColor: highRisk ? "#fb7185" : "#a78bfa"
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
      labels: ["Sleep", "Quality", "Activity", "Stress", "HR", "Steps"],
      datasets: [{
        data: [f.sleep_score, f.quality_score, f.activity_score, f.stress_score, f.heart_score, f.steps_score],
        backgroundColor: ["#a78bfa", "#7c3aed", "#60a5fa", "#fb7185", "#ffb84d", "#22d3ee"],
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
      labels: ["Sleep hrs", "Quality", "Stress", "Steps/1000"],
      datasets: [{
        data: [sleep, quality, stress, steps / 1000],
        backgroundColor: ["#a78bfa", "#60a5fa", "#fb7185", "#22d3ee"],
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
      <p><b>Sleep duration:</b> ${sleep.toFixed(1)} hours. ${sleep >= 7 && sleep <= 9 ? "This is in a healthy range." : "This may need improvement."}</p>
      <p><b>Stress level:</b> ${stress}/10. ${stress <= 4 ? "Low stress is supportive for sleep." : stress <= 7 ? "Moderate stress may affect sleep." : "High stress can strongly disturb sleep."}</p>
      <p><b>Activity:</b> ${activity}. ${activity >= 60 ? "Good activity level." : "More regular movement may improve sleep."}</p>
    </div>

    <div class="report-card">
      <h3>Model Output</h3>
      <p><b>Prediction:</b> ${d.prediction_label}</p>
      <p><b>Risk level:</b> ${d.risk_level}</p>
      <p><b>Risk score:</b> ${score}%</p>
    </div>
  `;

  results.style.display = "block";
  setTimeout(() => results.classList.add("show"), 30);
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}