<script>
  let { languageId } = $props();
  let exercises = $state([]);

  $effect(() => {
    fetch(`/api/languages/${languageId}/exercises`)
      .then((r) => r.json())
      .then((data) => {
        exercises = data;
      });
  });
</script>

<ul>
  {#each exercises as exercise}
    <li><a href={`/exercises/${exercise.id}`}>{exercise.title}</a></li>
  {/each}
</ul>
