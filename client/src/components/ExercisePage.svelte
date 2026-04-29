<script>
  import { useUserState } from "../states/userState.svelte.js";
  let userState = useUserState();

  let { exerciseId } = $props();

  let exercise = $state(null);
  let text = $state("");
  let gradingStatus = $state(null);
  let grade = $state(null);
  let prediction = $state(null);

  let typingTimer = null;

  $effect(() => {
    fetch(`/api/exercises/${exerciseId}`)
      .then((r) => r.json())
      .then((data) => {
        exercise = data;
      });
  });

  async function fetchPrediction() {
    const response = await fetch("/inference-api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        exercise: exercise.id,
        code: text
      })
    });
    const data = await response.json();
    prediction = Math.round(data.prediction);
  }

  function handleInput() {
    prediction = null;
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    typingTimer = setTimeout(() => {
      fetchPrediction();
    }, 500);
  }

  async function handleSubmit() {
    gradingStatus = null;
    grade = null;

    const response = await fetch(`/api/exercises/${exerciseId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_code: text }),
    });

    const { id: submissionId } = await response.json();

    const interval = setInterval(async () => {
      const statusResponse = await fetch(`/api/submissions/${submissionId}/status`);
      const data = await statusResponse.json();

      gradingStatus = data.grading_status;
      grade = data.grade;

      if (data.grading_status === "graded") {
        clearInterval(interval);
      }
    }, 500);
  }
</script>

{#if exercise}
  <h1>{exercise.title}</h1>
  <p>{exercise.description}</p>
{/if}

{#if userState.email}
  <textarea id="text" bind:value={text} oninput={handleInput}></textarea>
  <button id="submit" onclick={handleSubmit}>Submit</button>

  {#if prediction !== null}
    <p>Correctness estimate: {prediction}%</p>
  {/if}

  {#if gradingStatus !== null}
    <p>Grading status: {gradingStatus}</p>
  {/if}
  {#if grade !== null}
    <p>Grade: {grade}</p>
  {/if}
{:else}
  <p>Login or register to complete exercises.</p>
{/if}