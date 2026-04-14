import CodeBlock from './CodeBlock';

interface Param {
    name: string;
    type: string;
    required?: boolean;
    description: string;
}

interface EndpointBlockProps {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    title: string;
    description: string;
    params?: Param[];
    responseExample?: string;
    codeExamples: { label: string; code: string }[];
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 border-green-200',
    POST: 'bg-blue-100 text-blue-700 border-blue-200',
    PUT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PATCH: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
};

export default function EndpointBlock({ id, method, path, title, description, params, responseExample, codeExamples }: EndpointBlockProps) {
    return (
        <div id={id} className="scroll-mt-24 pb-10 mb-10 border-b border-neutral-200 last:border-0">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
            <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${METHOD_COLORS[method]}`}>{method}</span>
                <code className="text-sm font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">{path}</code>
            </div>
            <p className="text-sm text-neutral-600 mb-4">{description}</p>

            {params && params.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-2">Parameters</h4>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Name</th>
                                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Type</th>
                                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Required</th>
                                    <th className="px-3 py-2 text-left font-medium text-neutral-600">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {params.map((p, i) => (
                                    <tr key={i} className={i % 2 === 1 ? 'bg-neutral-50' : ''}>
                                        <td className="px-3 py-2 font-mono text-sm text-blue-700">{p.name}</td>
                                        <td className="px-3 py-2 text-neutral-500">{p.type}</td>
                                        <td className="px-3 py-2">{p.required ? <span className="text-red-600 text-xs font-bold">Required</span> : <span className="text-neutral-400 text-xs">Optional</span>}</td>
                                        <td className="px-3 py-2 text-neutral-600">{p.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {responseExample && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-2">Response</h4>
                    <pre className="bg-neutral-900 text-neutral-300 rounded-lg p-4 text-sm font-mono overflow-x-auto whitespace-pre">{responseExample}</pre>
                </div>
            )}

            <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Example</h4>
                <CodeBlock examples={codeExamples} />
            </div>
        </div>
    );
}
