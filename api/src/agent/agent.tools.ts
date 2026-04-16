import { tool } from "langchain";
import { ChromiaService } from "src/chromia/chromia.service";
import * as z from "zod";
class Tools {
  chromiaService: ChromiaService;
  constructor(_chromiaService: ChromiaService) {
    this.chromiaService = _chromiaService;
  }
  setupTools() {
    tool(this.chromiaService.get_all_shop_listings, {
      name: "",
      description: "",
      schema: z.object({}),
    });
  }
}
