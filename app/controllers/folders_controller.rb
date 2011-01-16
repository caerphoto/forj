class FoldersController < ApplicationController
    def create
        folder = Folder.create(
            :name => params[:name]
        )
        folder.save
        redirect_to msg_threads_path
    end

    def destroy
        folder = Folder.find(params[:id])
        if current_user.rank < 1
            return render :text => "UNAUTHORISED"
        end

        folder.destroy

        redirect_to msg_threads_path
    end

    def edit
        folder = Folder.find(params[:id])
        if current_user.rank < 1
            return render :text => "UNAUTHORISED"
        end

        folder.clearance = params[:clearance]
        folder.name = params[:newname]
        folder.save

        render :json => { :name => folder.name, :clearance => folder.clearance }.to_json
    end
end
