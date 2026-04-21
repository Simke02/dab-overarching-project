<script>
  let languages = $state([]);

  $effect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((data) => {
        languages = data;
      });
  });
</script>

<ul>
  {#each languages as language}
    <li><a href={`/languages/${language.id}`}>{language.name}</a></li>
  {/each}
</ul>
