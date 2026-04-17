<script>
  import { onMount } from "svelte";

  onMount(() => {
    const textarea = document.getElementById("text");
    const button = document.getElementById("submit");
    const charEl = document.getElementById("characters");
    const ifEl = document.getElementById("ifs");

    if (!textarea || !button) return;

    button.addEventListener("click", () => {
      const text = textarea.value;

      const characters = text.length;
      const ifs = (text.match(/if/g) || []).length;

      charEl.textContent = `Characters: ${characters}`;
      ifEl.textContent = `ifs: ${ifs}`;
    });
  });
</script>
