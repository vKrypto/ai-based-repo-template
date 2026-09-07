// attributeValueSubquery("display_label", "metal") -> correlated subquery resolving pv.id's metal display label
export function attributeValueSubquery(column: "display_label" | "value", filterKey: string): string {
  return `(
    SELECT av.${column}
    FROM variant_attribute_value vav
    JOIN attribute_value av ON av.id = vav.attribute_value_id
    JOIN attribute a ON a.id = av.attribute_id
    WHERE vav.variant_id = pv.id AND a.filter_key = '${filterKey}'
  )`;
}
