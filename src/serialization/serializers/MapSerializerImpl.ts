import { BaseSerializerImpl } from "../BaseSerializer";
import { DeserializeResult, DeserializeError } from "../DeserializeResult";
import { DeserializeContext } from "../DeserializeContext";
import { JSONValue } from "../../JSONValue";
import { SerializeContext } from "../SerializeContext";
import {
	getTypeMismatchMessage,
	isJSONValueOfType,
} from "../getTypeMismatchMessage";
import { Serializer } from "../Serializer";

export interface MapSerializer {
	kind: "map";
	valueSerializer: Serializer<any>;
}

export class MapSerializerImpl<TValue>
	extends BaseSerializerImpl<Record<string, TValue>, MapSerializer>
	implements MapSerializer {
	public readonly kind = "map";

	constructor(public readonly valueSerializer: Serializer<TValue>) {
		super();
	}

	protected internalDeserialize(
		value: JSONValue,
		context: DeserializeContext
	): DeserializeResult<Record<string, TValue>> {
		if (!isJSONValueOfType(value, "object")) {
			return DeserializeResult.fromError({
				message: getTypeMismatchMessage(value, { type: "object" }),
			});
		}

		const result: { [key: string]: TValue } = {};

		const childContext = context.withFirstDeserializationOnValue();

		const errors = new Array<DeserializeError>();

		for (const [key, val] of Object.entries(value)) {
			const r = this.valueSerializer.deserialize(val!, childContext);
			errors.push(...r.errors.map((e) => e.prependPath(key)));
			result[key] = r.value;
		}

		return DeserializeResult.fromValueWithError(result, ...errors);
	}

	protected internalCanSerialize(
		value: unknown
	): value is Record<string, TValue> {
		return value !== null && typeof value === "object";
	}

	protected internalSerialize(
		value: Record<string, TValue>,
		context: SerializeContext
	): JSONValue {
		const result: Record<string, JSONValue> = {};
		for (const [key, val] of Object.entries(value)) {
			result[key] = this.valueSerializer.serialize(val, context);
		}
		return result;
	}
}
