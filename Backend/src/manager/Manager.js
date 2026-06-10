class Manager {
  constructor(Model) {
    this.Model = Model;
  }

  create(data) {
    return this.Model.create(data);
  }

  read(filter = {}) {
    return this.Model.find(filter);
  }

  readOne(id) {
    return this.Model.findById(id);
  }

  update(id, data) {
    return this.Model.findByIdAndUpdate(id, data, { new: true });
  }

  destroy(id) {
    return this.Model.findByIdAndDelete(id);
  }

  readByEmail(email) {
    return this.Model.findOne({ email });
  }
}

export default Manager;
