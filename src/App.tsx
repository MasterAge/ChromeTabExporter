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

// This a very simple regex that works for all URLs I've tested.
// More complex regexes always fell over on typical examples
const URL_regex = new RegExp("[a-z]+:\\/\\/[^\\s]+", "i")

enum PluginTabs {
    export,
    import
}

interface AppState {
    tabs: Array<chrome.tabs.Tab>;
    delim: string;
    fieldOrder: Array<TabField>;
    example: string;
    showAlert: boolean;
    pluginTab: PluginTabs;
    urlImport: string;
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
            pluginTab: PluginTabs.export,
            urlImport: ""
        }

        chrome.tabs.query({currentWindow: true})
            .then(tabList => this.setState({tabs: tabList}, this.updateExample));
    }

    updateExample = () => {
        let outputExample = this.makeTabList(this.state.tabs.slice(0, 1));
        if (this.state.tabs.length > 1) {
            const remainingTabs = this.state.tabs.length - 1;
            outputExample += `\n  + ${remainingTabs} more ${(remainingTabs == 1) ? 'tab' : 'tabs'}`
        }
        this.setState({example: outputExample})
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
        this.setState({delim: event.target.value}, () => {
            this.updateExample();
            this.saveConfig();
        });
    }

    selectChange(selectIndex: number, event: ChangeEvent<HTMLSelectElement>) {
        const fieldOrder = [...this.state.fieldOrder];
        fieldOrder[selectIndex] = FieldMap.get(event.target.value) || NoneField;
        this.setState({fieldOrder: fieldOrder}, () => {
            this.updateExample();
            this.saveConfig();
        });
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
            // console.log(result);
            this.setState({
                delim: result.delim,
                fieldOrder: Array.of(...result.fieldOrder).map((fieldName: string) => FieldMap.get(fieldName) || NoneField)
            })
        });
    }

    selectTab = (tab: PluginTabs) => {
        this.setState({pluginTab: tab});
    }

    getTabClasses = (tab: PluginTabs) => {
        let classes = "tabButton";

        if (this.state.pluginTab == tab) {
            classes += " selectedTab";
        }

        return classes;
    }

    setUrls = (event: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({urlImport: event.target.value});
    }

    openTabs = () => {
        this.state.urlImport.split("\n").forEach((line) => {
            const url_match = URL_regex.exec(line);
            if (url_match != null) {
                chrome.tabs.create({url: url_match[0]}).then(() => {});
            }
        })
    }

    render() {
        return (
            <div className="App">
                <div className="tabList">
                    <h3
                        className={this.getTabClasses(PluginTabs.export)}
                        onClick={() => this.selectTab(PluginTabs.export)}
                    >
                        Tab Export
                    </h3>
                    <h3
                        className={this.getTabClasses(PluginTabs.import)}
                        onClick={() => this.selectTab(PluginTabs.import)}
                    >
                        Tab Import
                    </h3>
                </div>
                <div id="tabExport" hidden={this.state.pluginTab != PluginTabs.export}>
                    <div className="formLabel">Field separator:</div>
                    <div><input onChange={this.setDelim} className="delimInput controls" value={this.state.delim}/>
                    </div>
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
                <div id="tabImport" hidden={this.state.pluginTab != PluginTabs.import}>
                    <div className="formLabel">URLs:</div>
                    <textarea className="controls urlImportInput" cols={28} onChange={this.setUrls}/>
                    <button onClick={this.openTabs} className="exportButton controls">
                        Open Tabs
                    </button>
                </div>
            </div>
        );
    }
}

export default App;
