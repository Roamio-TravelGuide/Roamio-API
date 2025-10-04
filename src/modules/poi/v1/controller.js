import { PoiService } from "./service.js";

export default class PoiController {
  constructor() {
    this.poiService = new PoiService();
  }

  async getPoiById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const poi = await this.poiService.findById(id);
      if (!poi)
        return res
          .status(404)
          .json({ success: false, message: "POI not found" });
      return res.status(200).json({ success: true, data: poi });
    } catch (err) {
      console.error("Get POI by id error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async getPoisByVendorId(req, res) {
    try {
      const vendorId = parseInt(req.params.vendorId, 10);
      const pois = await this.poiService.findByVendorId(vendorId);
      return res.status(200).json({ success: true, data: pois });
    } catch (err) {
      console.error("Get POIs by vendor error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async getAllPois(req, res) {
    try {
      const pois = await this.poiService.findAll();
      return res.status(200).json({ success: true, data: pois });
    } catch (err) {
      console.error("Get all POIs error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}
