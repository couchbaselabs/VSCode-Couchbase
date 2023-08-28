import { createKeywordVariants } from 'components/editor/languages/custom/utils';

// functions from https://github.com/couchbase/query/blob/master/expression/func_registry.go
const arithmetic = 'ADD|DIV|IDIV|IMOD|MOD|MULT|NEG|SUB';
const collection = 'EXISTS|IN|WITHIN';
const comparison =
  'BETWEEN|EQ|IS_DISTINCT_FROM|IS_KNOWN|IS_MISSING|IS_NOT_DISTINCT_FROM|IS_NOT_KNOWN|IS_NOT_MISSING|IS_NOT_NULL|IS_NOT_VALUED|IS_NOT_UNKNOWN|IS_NULL|IS_VALUED|ISDISTINCTFROM|ISKNOWN|ISMISSING|ISNOTDISTINCTFROM|ISNOTKNOWN|ISNOTMISSING|ISNOTNULL|ISNOTUNKNOWN|ISNOTVALUED|ISNULL|ISUNKNOWN|ISVALUED|LE|LIKE|LT|LIKE_PREFIX|LIKE_STOP|LIKE_SUFFIX|REGEXP_PREFIX|REGEXP_STOP|REGEXP_SUFFIX';
const concat = 'CONCAT|CONCAT2';
const costruction = 'ARRAY';
const logic = 'AND|NOT|OR';
const navigation = 'ELEMENT|FIELD|RANDOM_ELEMENT|SLICE';
const crypto = 'HASHBYTES';
const curl = 'CURL';
const date =
  'CLOCK_LOCAL|CLOCK_MILLIS|CLOCK_STR|CLOCK_TZ|CLOCK_UTC|DATE_ADD_MILLIS|DATE_ADD_STR|DATE_DIFF_MILLIS|DATE_DIFF_STR|DATE_DIFF_ABS_STR|DATE_DIFF_ABS_MILLIS|DATE_FORMAT_STR|DATE_PART_MILLIS|DATE_PART_STR|DATE_RANGE_MILLIS|DATE_RANGE_STR|DATE_TRUNC_MILLIS|DATE_TRUNC_STR|DURATION_TO_STR|MILLIS|MILLIS_TO_LOCAL|MILLIS_TO_STR|MILLIS_TO_TZ|MILLIS_TO_UTC|MILLIS_TO_ZONE_NAME|NOW_LOCAL|NOW_MILLIS|NOW_STR|NOW_TZ|NOW_UTC|STR_TO_DURATION|STR_TO_MILLIS|STR_TO_TZ|STR_TO_UTC|STR_TO_ZONE_NAME|WEEKDAY_MILLIS|WEEKDAY_STR';
const string =
  'CONTAINS|INITCAP|LENGTH|LOWER|LPAD|LTRIM|MASK|POSITION|POS|POSITION0|POS0|POSITION1|POS1|REPEAT|REPLACE|REVERSE|RPAD|RTRIM|SPLIT|SUBSTR|SUBSTR0|SUBSTR1|SUFFIXES|TITLE|TRIM|UPPER|URLDECODE|URLENCODE';
const regularExpressions =
  'CONTAINS_REGEX|CONTAINS_REGEXP|REGEX_CONTAINS|REGEX_LIKE|REGEX_POSITION0|REGEX_POS0|REGEXP_POSITION0|REGEXP_POS0|REGEX_POSITION1|REGEX_POS1|REGEXP_POSITION1|REGEXP_POS1|REGEX_POSITION|REGEX_POS|REGEX_REPLACE|REGEXP_CONTAINS|REGEXP_LIKE|REGEXP_POSITION|REGEXP_POS|REGEXP_REPLACE|REGEXP_MATCHES|REGEXP_SPLIT';
const numeric =
  'ABS|ACOS|ASIN|ATAN|ATAN2|CEIL|COS|DEG|DEGREES|E|EXP|LN|LOG|FLOOR|INF|NAN|NEGINF|NEG_INF|PI|POSINF|POS_INF|POWER|RAD|RADIANS|RANDOM|ROUND|ROUND_EVEN|ROUND_NEAREST|SIGN|SIN|SQRT|TAN|TRUNC';
const bitwise = 'BITAND|BITOR|BITXOR|BITNOT|BITSHIFT|BITSET|BITCLEAR|BITTEST|ISBITSET';
const array =
  'ARRAY_ADD|ARRAY_APPEND|ARRAY_AVG|ARRAY_CONCAT|ARRAY_CONTAINS|ARRAY_CONTAINS_ALL|ARRAY_CONTAINS_ANY|ARRAY_COUNT|ARRAY_DISTINCT|ARRAY_FLATTEN|ARRAY_IFNULL|ARRAY_INSERT|ARRAY_INTERSECT|ARRAY_LENGTH|ARRAY_MAX|ARRAY_MIN|ARRAY_POSITION|ARRAY_POS|ARRAY_PREPEND|ARRAY_PUT|ARRAY_RANGE|ARRAY_REMOVE|ARRAY_REPEAT|ARRAY_REPLACE|ARRAY_REPLACE_EQUIVALENT|ARRAY_REVERSE|ARRAY_SORT|ARRAY_STAR|ARRAY_SUM|ARRAY_SYMDIFF|ARRAY_SYMDIFF1|ARRAY_SYMDIFFN|ARRAY_UNION|ARRAY_UPSERT|ARRAY_SWAP|ARRAY_MOVE|ARRAY_EXCEPT|ARRAY_BINARY_SEARCH';
const object =
  'OBJECT_ADD|OBJECT_CONCAT|OBJECT_CONCAT2|OBJECT_EXTRACT|OBJECT_FIELD|OBJECT_FILTER|OBJECT_INNER_PAIRS|OBJECT_INNERPAIRS|OBJECT_INNER_VALUES|OBJECT_INNERVALUES|OBJECT_LENGTH|OBJECT_NAMES|OBJECT_OUTER_PAIRS|OBJECT_OUTERPAIRS|OBJECT_OUTER_VALUES|OBJECT_OUTERVALUES|OBJECT_PAIRS|OBJECT_PAIRS_NESTED|OBJECT_PATHS|OBJECT_PUT|OBJECT_REMOVE|OBJECT_REMOVE_FIELDS|OBJECT_RENAME|OBJECT_REPLACE|OBJECT_TYPES|OBJECT_TYPES_NESTED|OBJECT_UNWRAP|OBJECT_VALUES';
const json = 'DECODE_JSON|ENCODE_JSON|ENCODED_SIZE|JSON_DECODE|JSON_ENCODE|PAIRS|POLY_LENGTH';
const base64 = 'BASE64|BASE64_DECODE|BASE64_ENCODE|DECODE_BASE64|ENCODE_BASE64';
const comparison2 = 'GREATEST|LEAST|SUCCESSOR';
const token = 'CONTAINS_TOKEN|CONTAINS_TOKEN_LIKE|CONTAINS_TOKEN_REGEX|CONTAINS_TOKEN_REGEXP|HAS_TOKEN|TOKENS';
const conditionalForUnknowns =
  'IF_MISSING|IF_MISSING_OR_NULL|IF_NULL|MISSING_IF|NULL_IF|IFMISSING|IFMISSINGORNULL|IFNULL|MISSINGIF|NULLIF|COALESCE|NVL|NVL2';
const conditionalForNumbers = 'IF_INF|IF_NAN|IF_NAN_OR_INF|NAN_IF|NEGINF_IF|POSINF_IF|IFINF|IFNAN|IFNANORINF|NANIF|NEGINFIF|POSINFIF';
const flowControl = 'ABORT';
const meta = 'META|MIN_VERSION|SELF|UUID|VERSION|CURRENT_USERS|DS_VERSION';
const distributed = 'NODE_NAME';
const typeChecking =
  'IS_ARRAY|IS_ATOM|IS_BIN|IS_BINARY|IS_BOOL|IS_BOOLEAN|IS_NUM|IS_NUMBER|IS_OBJ|IS_OBJECT|IS_STR|IS_STRING|ISARRAY|ISATOM|ISBIN|ISBINARY|ISBOOL|ISBOOLEAN|ISNUM|ISNUMBER|ISOBJ|ISOBJECT|ISSTR|ISSTRING|TYPE|TYPE_NAME|TYPENAME';
const typeConversion =
  'TO_ARRAY|TO_ATOM|TO_BOOL|TO_BOOLEAN|TO_NUM|TO_NUMBER|TO_OBJ|TO_OBJECT|TO_STR|TO_STRING|TOARRAY|TOATOM|TOBOOL|TOBOOLEAN|TONUM|TONUMBER|TOOBJ|TOOBJECT|TOSTR|TOSTRING|DECODE';
const unnest = 'UNNEST_POSITION|UNNEST_POS|FLATTEN_KEYS';
const indexAdvisor = 'ADVISOR';
const general = 'LEN';
const infer = 'INFER_VALUE|INFERVALUE|INFER';
const others = '_TIMESERIES';

// plus aggregates from https://github.com/couchbase/query/blob/master/algebra/agg_registry.go
const aggregates =
  'ARRAY_AGG|AVG|COUNT|COUNTN|MAX|MEAN|MEDIAN|MIN|STDDEV|STDDEV_POP|STDDEV_SAMP|SUM|VARIANCE|VAR_POP|VARIANCE_POP|VAR_SAMP|VARIANCE_SAMP|ROW_NUMBER|RANK|DENSE_RANK|PERCENT_RANK|CUME_DIST|RATIO_TO_REPORT|NTILE|FIRST_VALUE|LAST_VALUE|NTH_VALUE|LAG|LEAD';

// functions
export const [builtinFunctions, lowerBuiltinFunctions] = createKeywordVariants(
  `${arithmetic}|${collection}|${comparison}|${concat}|${costruction}|${logic}|${navigation}|${crypto}|${curl}|${date}|${string}|${regularExpressions}|${numeric}|${bitwise}|${array}|${object}|${json}|${base64}|${comparison2}|${token}|${conditionalForUnknowns}|${conditionalForNumbers}|${flowControl}|${meta}|${distributed}|${typeChecking}|${typeConversion}|${unnest}|${indexAdvisor}|${general}|${infer}|${others}|${aggregates}`
);

const sysCatalogs =
  'system:active_requests|system:applicable_roles|system:completed_requests|system:datastores|system:dual|system:functions|system:functions_cache|system:indexes|system:keyspaces|system:my_user_info|system:namespaces|system:nodes|system:prepareds|system:user_info|system';

// constants
export const [builtinConstants, lowerBuiltinConstants] = createKeywordVariants(`TRUE|FALSE|INDEXES|KEYSPACES|${sysCatalogs}`);

// keywords
export const [keywords, lowerKeywords] = createKeywordVariants(
  'ADVISE|ALL|ALTER|ANALYZE|AND|ANY|ARRAY|AS|ASC|BEGIN|BETWEEN|BINARY|BOOLEAN|BREAK|BUCKET|BUILD|BY|CALL|CASE|CAST|CLUSTER|COLLATE|COLLECTION|COMMIT|CONNECT|CONTINUE|CORRELATED|CORRELATE|COVER|CREATE|CURRENT|DATABASE|DATASET|DATASTORE|DECLARE|DECREMENT|DELETE|DERIVED|DESC|DESCRIBE|DISTINCT|DO|DROP|EACH|ELEMENT|ELSE|END|EVERY|EXCEPT|EXCLUDE|EXECUTE|EXISTS|EXPLAIN|FETCH|FIRST|FLATTEN|FOLLOWING|FOR|FORCE|FROM|FTS|FUNCTION|GOLANG|GRANT|GROUP|GROUPS|GSI|HASH|HAVING|IF|IGNORE|ILIKE|IN|INCLUDE|INCREMENT|INDEX|INFER|INLINE|INNER|INSERT|INTERSECT|INTO|IS|JAVASCRIPT|JOIN|KEY|KEYS|KEYSPACE|KNOWN|LANGUAGE|LAST|LEFT|LET|LETTING|LIKE|LIMIT|LSM|MAP|MAPPING|MATCHED|MATERIALIZED|MERGE|MINUS|MISSING|NAMESPACE|NAMESPACE_ID|NEST|NL|NO|NOT|NOT_A_TOKEN|NTH_VALUE|NULL|NULLS|NUMBER|OBJECT|OFFSET|ON|OPTION|OR|ORDER|OTHERS|OUTER|OVER|PARSE|PARTITION|PASSWORD|PATH|POOL|PRECEDING|PREPARE|PRIMARY|PRIVATE|PRIVILEGE|PROBE|PROCEDURE|PUBLIC|RANGE|RAW|REALM|REDUCE|RENAME|RESPECT|RETURN|RETURNING|REVOKE|RIGHT|ROLE|ROLLBACK|ROW|ROWS|SATISFIES|SAVEPOINT|SCHEMA|SELECT|SELF|SEMI|SET|SHOW|SOME|START|STATISTICS|STRING|SYSTEM|THEN|TIES|TO|TRAN|TRANSACTION|TRIGGER|TRUNCATE|UNBOUNDED|UNDER|UNION|UNIQUE|UNKNOWN|UNNEST|UNSET|UPDATE|UPSERT|USE|USER|USING|VALIDATE|VALUE|VALUED|VALUES|VIA|VIEW|WHEN|WHERE|WHILE|WITH|WITHIN|WORK|XOR'
);

// operators
export const [operators, operatorsLower] = createKeywordVariants('+|-|//|%|<@>|@>|<@|&|^|~|<|>|<=|=>|==|!=|<>|=');
