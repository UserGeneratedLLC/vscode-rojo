const { readFile, writeFile, mkdir } = require("fs/promises")
const https = require('https')

const API_DUMP_URL = "https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Tracker/roblox/API-Dump.json"

function getAPIDump() {
	return new Promise((resolve, reject) => {
		const req = https.get(API_DUMP_URL, res => {
			let raw = ""

			res.on('data', chunk => {
				raw += chunk;
			})

			res.on('end', () => {
				const data = JSON.parse(raw);
				resolve(data)
			})

		}).on('error', err => reject)

		req.end()
	})
}

function getServiceNames(APIDump) {
	const services = []

	for (const thisClass of APIDump.Classes) {
		const tags = thisClass.Tags
		if (tags && tags.includes("Service")) {
			services.push(thisClass.Name)
		}
	}

	return services
}

function getClassNames(APIDump) {
	const services = []

	for (const thisClass of APIDump.Classes) {
		services.push(thisClass.Name)
	}

	return services
}

async function generateSchemas() {
	const dump = await getAPIDump()
	const classesEnum = getClassNames(dump)
	const services = getServiceNames(dump)

	await mkdir("dist", { recursive: true })

	// --- Project schema ---
	const projectSchema = JSON.parse((await readFile("schemas/project.template.schema.json")).toString())

	const servicesRoot = projectSchema.properties.tree.then.allOf[1].properties
	for (const service of services) {
		if (!servicesRoot[service]) {
			servicesRoot[service] = {
				"$ref": "#/$defs/treeService"
			}
		}
	}

	const classesAnyOf = projectSchema["$defs"].tree.properties["$className"].anyOf
	classesAnyOf.push({
		"enum": classesEnum,
	})

	await writeFile("dist/project.schema.json", JSON.stringify(projectSchema))

	// --- Meta schema ---
	const metaSchema = JSON.parse((await readFile("schemas/meta.template.schema.json")).toString())

	// Inject class names into className field
	metaSchema.properties.className.enum = classesEnum

	await writeFile("dist/meta.schema.json", JSON.stringify(metaSchema))

	// --- Model schema ---
	const modelSchema = JSON.parse((await readFile("schemas/model.template.schema.json")).toString())

	// Inject class names into root className and child className
	const modelClassAnyOf = modelSchema.properties.className.anyOf
	modelClassAnyOf.push({
		"enum": classesEnum,
	})

	const childClassAnyOf = modelSchema["$defs"].modelChild.properties.className.anyOf
	childClassAnyOf.push({
		"enum": classesEnum,
	})

	await writeFile("dist/model.schema.json", JSON.stringify(modelSchema))
}

module.exports = class GenerateSchemaPlugin {
	apply(compiler) {
		compiler.hooks.compile.tap("GenerateSchema", async () => {
			generateSchemas()
		})
	}
}
