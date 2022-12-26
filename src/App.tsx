import React, {ChangeEvent} from 'react';
import './App.css';
import Tab = chrome.tabs.Tab;

interface TabField {
    id: number;
    name: string;
    extractor: (tab: Tab) => string | undefined;
}

const NoneField: TabField = {id: 0, name: "None", extractor: () => ""}
const UrlField: TabField = {id: 1, name: "Url", extractor: (tab) => tab.url}
const TitleField: TabField = {id: 2, name: "Title", extractor: (tab) => tab.title}
const IndexField: TabField = {id: 3, name: "Index", extractor: (tab) => String(tab.index + 1)}

const FieldMap: Map<string, TabField> = new Map<string, TabField>([
    ["None", NoneField],
    ["Url", UrlField],
    ["Title", TitleField],
    ["Index", IndexField],
]);

const FieldOptions: string[] = Array.from(FieldMap.keys());

interface AppState {
    tabs: Array<chrome.tabs.Tab>;
    delim: string;
    fieldOrder: Array<TabField>;

    example: string;

    showAlert: boolean;
}

class App extends React.Component<{}, AppState> {
    constructor(props: Readonly<{}>) {
        super(props);
        this.state = {
            tabs: [],
            delim: " | ",
            fieldOrder: [UrlField, NoneField, NoneField],
            example: "https://url/page",
            showAlert: false,
        }

        chrome.tabs.query({currentWindow: true})
            .then(tabList => this.setState({tabs: tabList}));
    }

    updateExample = () => {
        const exampleTabList = [{index: 1, title: "Title", url: "https://url/page"}] as Tab[];
        this.setState({example: this.makeTabList(exampleTabList)})
    }

    makeTabList = (tabs: chrome.tabs.Tab[]): string => {
        const populateTabDetails = (tab: Tab) => this.state.fieldOrder
            .filter(field => field.id != NoneField.id)
            .map(field => field.extractor(tab))
            .join(this.state.delim)

        return tabs.map(populateTabDetails).join("\n");
    }

    exportTabs = () => {
        void navigator.clipboard.writeText(this.makeTabList(this.state.tabs));
        this.setState({showAlert: true})
        this.saveConfig();
        setTimeout(() => this.setState({showAlert: false}), 3000);
    }

    componentDidMount = () => {
        this.loadConfig();
        this.updateExample();
    }

    setDelim = (event: ChangeEvent<HTMLInputElement>) => {
        this.setState({delim: event.target.value}, this.updateExample)
    }

    selectChange(selectIndex: number, event: ChangeEvent<HTMLSelectElement>) {
        const fieldOrder = [...this.state.fieldOrder];
        fieldOrder[selectIndex] = FieldMap.get(event.target.value) || NoneField;
        this.setState({fieldOrder: fieldOrder}, this.updateExample);
    }

    fieldSelected = (): boolean => {
        return this.state.fieldOrder.some(field => field.id != NoneField.id);
    }

    saveConfig = () => {
        void chrome.storage.sync.set({
            "fieldOrder": this.state.fieldOrder.map(field => field.name),
            "delim": this.state.delim,
        });
    }

    loadConfig = () => {
        chrome.storage.sync.get(["fieldOrder", "delim"]).then(result => {
            console.log(result);
            this.setState({
                delim: result.delim,
                fieldOrder: Array.of(...result.fieldOrder).map((fieldName: string) => FieldMap.get(fieldName) || NoneField)
            })
        });
    }

    render() {
        return (
            <div className="App">
                <h3 className="heading">Tab Export</h3>
                <div className="formLabel">Field separator:</div>
                <div><input onChange={this.setDelim} className="delimInput controls" value={this.state.delim}/></div>
                <div className="formLabel">Field order:</div>
                <div className="fieldGroup">
                    {[0, 1, 2].map(index => (
                        <select
                            className="controls fieldSelect"
                            value={this.state.fieldOrder[index].name}
                            onChange={this.selectChange.bind(this, index)}
                        >
                            {FieldOptions.map(option => <option value={option}>{option}</option>)}
                        </select>
                    ))}
                </div>
                <div className="formLabel">Example:</div>
                <pre className="tabListPreview">
                    {this.state.example}
                </pre>
                <button onClick={this.exportTabs} className="exportButton controls" disabled={!this.fieldSelected}>
                    Export tabs to clipboard
                </button>
                <div className="alert" hidden={!this.state.showAlert}>
                    Tabs exported to clipboard
                </div>
            </div>
        );
    }
}

export default App;
