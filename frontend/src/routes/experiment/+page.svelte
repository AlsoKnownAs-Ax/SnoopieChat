<script lang="ts">
	import ExperimentDashboard from '$lib/components/encrypted-chat/ExperimentDashboard.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ExperimentConfigurations } from '$lib/encryption';
	import { Beaker, BookOpen, Shield } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Double Ratchet Experiments</title>
	<meta name="description" content="Academic experiments with Double Ratchet protocol configurations" />
</svelte:head>

<div class="container mx-auto py-8 space-y-8">
	<!-- Header -->
	<div class="text-center space-y-4">
		<div class="flex justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<Beaker class="h-8 w-8 text-primary" />
			</div>
		</div>
		<h1 class="text-4xl font-bold tracking-tight">Double Ratchet Experiments</h1>
		<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
			Academic research platform for studying different Double Ratchet protocol configurations,
			performance characteristics, and security properties.
		</p>
	</div>

	<!-- Overview Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Shield class="h-5 w-5" />
					Security Analysis
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground mb-3">
					Study forward secrecy, post-compromise security, and key evolution patterns
				</p>
				<div class="flex flex-wrap gap-1">
					<Badge variant="outline" class="text-xs">Forward Secrecy</Badge>
					<Badge variant="outline" class="text-xs">Key Rotation</Badge>
					<Badge variant="outline" class="text-xs">Compromise Recovery</Badge>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Beaker class="h-5 w-5" />
					Performance Testing
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground mb-3">
					Benchmark encryption/decryption speed, memory usage, and scalability
				</p>
				<div class="flex flex-wrap gap-1">
					<Badge variant="outline" class="text-xs">Throughput</Badge>
					<Badge variant="outline" class="text-xs">Latency</Badge>
					<Badge variant="outline" class="text-xs">Memory Usage</Badge>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<BookOpen class="h-5 w-5" />
					Academic Research
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground mb-3">
					Generate data for academic papers and protocol analysis
				</p>
				<div class="flex flex-wrap gap-1">
					<Badge variant="outline" class="text-xs">Export Data</Badge>
					<Badge variant="outline" class="text-xs">Comparisons</Badge>
					<Badge variant="outline" class="text-xs">Metrics</Badge>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Available Configurations -->
	<Card>
		<CardHeader>
			<CardTitle>Available Research Configurations</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each ExperimentConfigurations.getConfigurationNames() as configName}
					{@const config = ExperimentConfigurations.getConfiguration(configName)}
					{@const summary = ExperimentConfigurations.getConfigurationSummary(config)}
					<div class="border rounded-lg p-4 space-y-3">
						<h4 class="font-medium">{configName.replace('_', ' ')}</h4>
						<div class="flex flex-wrap gap-1">
							<Badge variant={summary.security === 'High' ? 'default' : summary.security === 'Medium' ? 'secondary' : 'outline'} class="text-xs">
								Sec: {summary.security}
							</Badge>
							<Badge variant={summary.performance === 'High' ? 'default' : summary.performance === 'Medium' ? 'secondary' : 'outline'} class="text-xs">
								Perf: {summary.performance}
							</Badge>
							<Badge variant={summary.memoryUsage === 'Low' ? 'default' : summary.memoryUsage === 'Medium' ? 'secondary' : 'destructive'} class="text-xs">
								Mem: {summary.memoryUsage}
							</Badge>
						</div>
						<div class="text-xs text-muted-foreground">
							{summary.suitableFor[0] || 'General purpose'}
						</div>
						<div class="text-xs space-y-1">
							<div class="flex justify-between">
								<span>Max Skip:</span>
								<span class="font-mono">{config.maxSkippedMessageKeys}</span>
							</div>
							<div class="flex justify-between">
								<span>Pre-keys:</span>
								<span class="font-mono">{config.preKeyGenerationCount}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Main Experiment Dashboard -->
	<ExperimentDashboard />

	<!-- Academic Notes -->
	<Card>
		<CardHeader>
			<CardTitle>Academic Research Notes</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="text-sm space-y-2">
				<h4 class="font-medium">Research Areas:</h4>
				<ul class="list-disc list-inside space-y-1 text-muted-foreground">
					<li><strong>Forward Secrecy:</strong> Study how different key evolution frequencies affect forward secrecy guarantees</li>
					<li><strong>Performance vs Security:</strong> Analyze trade-offs between cryptographic strength and computational efficiency</li>
					<li><strong>Network Resilience:</strong> Test protocol behavior under packet loss, reordering, and delays</li>
					<li><strong>Memory Constraints:</strong> Evaluate suitability for IoT and resource-constrained environments</li>
					<li><strong>Post-Compromise Security:</strong> Measure recovery time after key compromise scenarios</li>
				</ul>
			</div>
			
			<div class="text-sm space-y-2">
				<h4 class="font-medium">Usage for Academic Papers:</h4>
				<ol class="list-decimal list-inside space-y-1 text-muted-foreground">
					<li>Select or create custom configurations for your research hypothesis</li>
					<li>Run experiments with controlled parameters and realistic workloads</li>
					<li>Export results as JSON for further analysis in R, Python, or MATLAB</li>
					<li>Compare different configurations to demonstrate trade-offs</li>
					<li>Use the detailed metrics for performance evaluation sections</li>
				</ol>
			</div>
		</CardContent>
	</Card>
</div> 