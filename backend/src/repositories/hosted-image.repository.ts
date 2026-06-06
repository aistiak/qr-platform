import HostedImage from '../models/HostedImage';

export class HostedImageRepository {
  async createHostedImage(data: {
    userId: string;
    filename: string;
    originalFilename: string;
    filePath: string;
    mimeType: 'image/jpeg' | 'image/png';
    fileSize: number;
    width: number;
    height: number;
  }) {
    return HostedImage.create(data);
  }

  async findById(id: string) {
    return HostedImage.findById(id);
  }

  async findByIdForUser(id: string, userId: string) {
    return HostedImage.findOne({ _id: id, userId });
  }

  async deleteById(id: string) {
    return HostedImage.findByIdAndDelete(id);
  }
}
