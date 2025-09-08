<script>
	export let name;
	export let setData;
	export let onSet
	export let onUnset
	export let isVegeSeller = 0
	export let badge = 0

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
	{#if badge > 0}
		<div class="badge badge-sm badge-primary" style="position: absolute; right: 5px; top: 3px;">+1</div>
	{/if}
	<figure class="h-[20vw]">
		<img src=/assets/vege_icon/{name}.png alt="carrot" />
	</figure>
	<div class="card-body h-[10vw] pt-3">
		{#if setData >= 0 && setData != null && !(isVegeSeller == 1 && setData == 0)}
			<h2 class="card-title justify-center">
				<button class="badge badge-secondary" on:click={onUnset(name)}>{isVegeSeller == 1 ? '購入' : (isVegeSeller == 2 ? `${setData}個` : (`${setData == 0 ? 0 : Math.floor(((new Date()).getTime() - setData) / (24 * 60 * 60 * 1000))}日`))}</button>
			</h2>
		{:else}
			<div class="card-actions justify-center">
				<button class="badge badge-outline" on:click={onSet(name)}>{isVegeSeller == 1 ? '0個': '登録'}</button>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style>
