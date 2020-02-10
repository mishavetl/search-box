import { ElementController } from './element-controller'
import { DataProvider } from "./data-provider";
import { DefaultTemplateManager } from "./default-template-manager";

export class SearchBox {
    private dataProvider = new DataProvider();
    private elementController: ElementController;

    public setUrl(url: string): this {
        this.dataProvider.setUrl(url);
        return this;
    }

    public setIdProperty(idProperty: string): this {
        this.dataProvider.idProperty = idProperty;
        return this;
    }

    public setTermProperty(termProperty: string): this {
        this.dataProvider.termProperty = termProperty;
        return this;
    }

    public bindToInput(originalElement: HTMLInputElement): this {
        if (this.elementController) {
            this.elementController.unbind();
        }
        this.elementController = new ElementController(this.dataProvider, new DefaultTemplateManager(), originalElement);
        return this;
    }

    public unbind(): this {
        this.elementController.unbind();
        return this;
    }
}
