<script>
	export let name;
	export let pastDate;
	export let onSet
	export let onUnset

  const bgColor = {
		green_pepper: 'green',
		eggplant: 'purple',
		green_onion: 'sky',
		carrot: 'rose',
		cabbage: 'indigo',
		potato: 'slate',
		yellow_pepper: 'amber',
		onion: 'lime',
		tomato: 'red',
	}
</script>

<div class="card bg-{bgColor[name] ?? 'gray'}-300 shadow-xl w-[29vw] max-w-48 max-h-48 h-[29vw] m-1">
	<figure class="h-[20vw]">
		<img src=/assets/vege_icon/{name}.png alt="carrot" />
	</figure>
	<div class="card-body h-[10vw] pt-3">
		{#if pastDate >= 0 && pastDate != null}
			<h2 class="card-title justify-center">
				<button class="badge badge-secondary" on:click={onUnset(name)}>{pastDate == 0 ? 0 : Math.floor(((new Date()).getTime() - pastDate) / (24 * 60 * 60 * 1000))}日</button>
			</h2>
		{:else}
			<div class="card-actions justify-center">
				<button class="badge badge-outline" on:click={onSet(name)}>登録</button>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style>
