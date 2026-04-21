<script>
  let { exerciseId } = $props();

  let exercise = $state(null);
  let text = $state("");
  let gradingStatus = $state(null);
  let grade = $state(null);

  $effect(() => {
    fetch(`/api/exercises/${exerciseId}`)
      .then((r) => r.json())
      .then((data) => {
        exercise = data;
      });
  });

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

<textarea id="text" bind:value={text}></textarea>
<button id="submit" onclick={handleSubmit}>Submit</button>

{#if gradingStatus !== null}
  <p>Grading status: {gradingStatus}</p>
{/if}
{#if grade !== null}
  <p>Grade: {grade}</p>
{/if}
