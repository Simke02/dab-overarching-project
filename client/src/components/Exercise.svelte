<script>
  import { onMount } from "svelte";

  let characters = null;
  let ifs = null;

  onMount(() => {
    const button = document.getElementById("submit");
    const textarea = document.getElementById("text");

    button.addEventListener("click", () => {
      const text = textarea.value;
      characters = text.length;
      ifs = (text.match(/if/g) || []).length;
    });
  });
</script>

{#if characters !== null}
  <p>Characters: {characters}</p>
{/if}
{#if ifs !== null}
  <p>ifs: {ifs}</p>
{/if}