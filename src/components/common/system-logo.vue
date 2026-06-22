<!--
 <script lang="ts" setup>
defineOptions({ name: 'SystemLogo' });
</script>

<template>
  <icon-local-logo />
</template>

<style scoped></style> 
-->
<script lang="ts" setup>
defineOptions({ name: 'SystemLogo' });
</script>

<template>
  <img src="@/assets/imgs/logo.png" alt="系统Logo" class="system-logo" />
</template>

<style scoped>
.system-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: inline-block;
  vertical-align: middle;
}
</style>
