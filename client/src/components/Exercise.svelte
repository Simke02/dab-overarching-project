<script>
  let characters = $state(null);
  let ifs = $state(null);

  $effect(() => {
    const button = document.getElementById("submit");
    const textarea = document.getElementById("text");

    function handleClick() {
      const text = textarea.value;
      characters = text.length;
      ifs = (text.match(/if/g) || []).length;
    }

    button.addEventListener("click", handleClick);

    return () => {
      button.removeEventListener("click", handleClick);
    };
  });
</script>

{#if characters !== null}
  <p>Characters: {characters}</p>
{/if}
{#if ifs !== null}
  <p>ifs: {ifs}</p>
{/if}